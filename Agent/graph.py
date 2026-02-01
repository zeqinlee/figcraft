"""LangGraph 工作流 — 生成 → 执行 → 自动修复"""

from typing import Annotated, Literal, Optional, Sequence
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

from executor import extract_code, execute_code, ExecResult


# ========== State ==========

class AgentState(TypedDict):
    """图的状态"""
    messages: Annotated[Sequence[BaseMessage], lambda a, b: list(a) + list(b)]
    last_code: Optional[str]
    output_file: Optional[str]
    retry_count: int
    error: Optional[str]


# ========== Nodes ==========

def generate_node(state: AgentState, llm) -> dict:
    """调用 LLM 生成 flowing 代码"""
    response = llm.invoke(state["messages"])
    return {
        "messages": [response],
        "error": None,
    }


def execute_node(state: AgentState) -> dict:
    """从最新的 AI 回复中提取代码并执行"""
    # 找最后一条 AI 消息
    last_ai = None
    for msg in reversed(state["messages"]):
        if isinstance(msg, AIMessage):
            last_ai = msg
            break

    if not last_ai:
        return {"error": "LLM 未返回任何回复", "last_code": None}

    code = extract_code(last_ai.content)
    if not code:
        return {
            "error": f"LLM 未返回有效代码:\n{last_ai.content[:300]}",
            "last_code": None,
        }

    result = execute_code(code)

    if result.success:
        return {
            "last_code": code,
            "output_file": result.output_file,
            "error": None,
            "retry_count": 0,
        }
    else:
        return {
            "last_code": code,
            "error": result.error[:1000] if result.error else "未知错误",
            "retry_count": state.get("retry_count", 0) + 1,
        }


def fix_node(state: AgentState) -> dict:
    """将执行错误反馈给 LLM，请求修复"""
    error_msg = state.get("error", "未知错误")
    fix_message = HumanMessage(
        content=f"代码执行报错:\n{error_msg}\n\n请修复代码并重新输出完整的 TypeScript 代码块。"
    )
    return {"messages": [fix_message]}


# ========== Router ==========

def should_fix(state: AgentState) -> Literal["fix", "done"]:
    """执行后路由：有错误且重试次数 < 2 → 修复，否则结束"""
    if state.get("error") and state.get("retry_count", 0) <= 2:
        return "fix"
    return "done"


# ========== Graph Builder ==========

def build_graph(llm):
    """构建 LangGraph 工作流

    流程:
      generate → execute → (success) → END
                         → (error, retry<2) → fix → generate → ...
                         → (error, retry>=2) → END
    """
    graph = StateGraph(AgentState)

    # 绑定 LLM 到 generate node
    def gen(state):
        return generate_node(state, llm)

    graph.add_node("generate", gen)
    graph.add_node("execute", execute_node)
    graph.add_node("fix", fix_node)

    # 边
    graph.set_entry_point("generate")
    graph.add_edge("generate", "execute")
    graph.add_conditional_edges("execute", should_fix, {
        "fix": "fix",
        "done": END,
    })
    graph.add_edge("fix", "generate")

    return graph.compile()

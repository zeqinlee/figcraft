#!/usr/bin/env python3
"""Flowing Agent — LangGraph 驱动的智能图表生成器"""

import os
import sys

# 确保 Agent/ 目录在 path 中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

from config import load_config, setup_wizard
from prompt import build_system_prompt
from graph import build_graph


def create_llm(config: dict):
    """根据配置创建 LangChain LLM 实例"""
    provider = config.get("provider", "tongyi")

    if provider == "tongyi":
        cfg = config.get("tongyi", {})
        return ChatOpenAI(
            api_key=cfg.get("api_key", ""),
            base_url=cfg.get("endpoint", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            model=cfg.get("model", "qwen-plus"),
            temperature=0.3,
        )

    elif provider == "claude":
        cfg = config.get("claude", {})
        token = cfg.get("oauth_token") or cfg.get("api_key", "")
        return ChatAnthropic(
            api_key=token,
            model_name=cfg.get("model", "claude-sonnet-4-20250514"),
            temperature=0.3,
            max_tokens=4096,
        )

    elif provider == "custom":
        cfg = config.get("custom", {})
        return ChatOpenAI(
            api_key=cfg.get("api_key", ""),
            base_url=cfg.get("endpoint", ""),
            model=cfg.get("model", ""),
            temperature=0.3,
        )

    else:
        raise ValueError(f"未知的 provider: {provider}")


def main():
    args = sys.argv[1:]

    # --setup
    if "--setup" in args:
        setup_wizard()
        return

    # 加载配置
    config = load_config()
    if not config or not config.get("provider"):
        print("首次使用，需要配置 LLM 服务商。")
        config = setup_wizard()

    # --provider 临时切换
    if "--provider" in args:
        idx = args.index("--provider")
        if idx + 1 < len(args):
            config["provider"] = args[idx + 1]

    provider_name = config["provider"]
    llm = create_llm(config)
    output_dir = os.getcwd()
    system_prompt = build_system_prompt(output_dir)
    app = build_graph(llm)

    # 对话历史（LangGraph 的 messages 会自动累积，这里维护完整历史）
    history = [SystemMessage(content=system_prompt)]

    print()
    print("╔══════════════════════════════════════╗")
    print(f"║   Flowing Agent — 智能图表生成器     ║")
    print(f"║   LLM: {provider_name:<29s}║")
    print(f"║   输出目录: {output_dir[-23:]:<25s}║")
    print("╚══════════════════════════════════════╝")
    print()
    print("输入图表描述开始生成，或输入命令:")
    print("  /quit     退出")
    print("  /switch   切换 LLM")
    print("  /setup    重新配置")
    print("  /last     查看上次生成的代码")
    print("  /clear    清除对话历史")
    print()

    last_code = ""

    while True:
        try:
            user_input = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见!")
            break

        if not user_input:
            continue

        # 命令处理
        if user_input in ("/quit", "/exit"):
            print("再见!")
            break

        if user_input == "/last":
            if last_code:
                print("\n--- 上次生成的代码 ---")
                print(last_code)
                print("--- 结束 ---\n")
            else:
                print("还没有生成过代码。\n")
            continue

        if user_input == "/clear":
            history = [SystemMessage(content=system_prompt)]
            print("对话历史已清除。\n")
            continue

        if user_input == "/setup":
            config = setup_wizard()
            llm = create_llm(config)
            app = build_graph(llm)
            provider_name = config["provider"]
            print(f"配置已更新，当前 LLM: {provider_name}\n")
            continue

        if user_input.startswith("/switch"):
            parts = user_input.split()
            if len(parts) < 2:
                print(f"当前: {provider_name}")
                print("用法: /switch tongyi|claude|custom\n")
            else:
                p = parts[1]
                if p in ("tongyi", "claude", "custom"):
                    config["provider"] = p
                    try:
                        llm = create_llm(config)
                        app = build_graph(llm)
                        provider_name = p
                        print(f"已切换到 {p}\n")
                    except Exception as e:
                        print(f"切换失败: {e}\n")
                else:
                    print(f"未知 provider: {p}\n")
            continue

        # 正常对话 — 调用 LangGraph
        history.append(HumanMessage(content=user_input))
        print("\n生成中...")

        try:
            result = app.invoke({
                "messages": list(history),
                "last_code": None,
                "output_file": None,
                "retry_count": 0,
                "error": None,
            })

            # 更新历史（从 result messages 中取新增的部分）
            new_messages = result.get("messages", [])
            if len(new_messages) > len(history):
                history = list(new_messages)

            last_code = result.get("last_code", "") or ""
            output_file = result.get("output_file")
            error = result.get("error")

            if output_file and not error:
                print(f"\n生成成功!")
                print(f"输出文件: {output_file}\n")
            elif error:
                print(f"\n执行失败: {error[:300]}")
                print("请用 /last 查看代码，调整描述重试。\n")
            else:
                print("\n完成（未检测到输出文件路径）\n")

        except Exception as e:
            print(f"\n错误: {e}\n")


if __name__ == "__main__":
    main()

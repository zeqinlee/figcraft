"""代码提取 + tsx 执行"""

import os
import re
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Optional

FLOWING_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@dataclass
class ExecResult:
    success: bool
    code: str
    output_file: Optional[str] = None
    error: Optional[str] = None
    stdout: Optional[str] = None


def extract_code(response: str) -> Optional[str]:
    """从 LLM 响应中提取 TypeScript 代码块"""
    # ```typescript ... ``` 或 ```ts ... ```
    m = re.search(r"```(?:typescript|ts)\s*\n(.*?)```", response, re.DOTALL)
    if m:
        return m.group(1).strip()
    # 回退：任意 ``` ... ```
    m = re.search(r"```\s*\n(.*?)```", response, re.DOTALL)
    if m:
        return m.group(1).strip()
    return None


def find_output_path(code: str) -> Optional[str]:
    """从代码中提取 export 输出路径"""
    m = re.search(r"""export\(['"]([^'"]+)['"]""", code)
    return m.group(1) if m else None


def execute_code(code: str) -> ExecResult:
    """将代码写入临时文件，用 npx tsx 执行"""
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".ts", prefix="flowing_agent_",
        dir="/tmp", delete=False, encoding="utf-8",
    )
    tmp.write(code)
    tmp.close()

    try:
        result = subprocess.run(
            ["npx", "tsx", tmp.name],
            cwd=FLOWING_ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode == 0:
            output_file = find_output_path(code)
            return ExecResult(
                success=True,
                code=code,
                output_file=output_file,
                stdout=result.stdout,
            )
        else:
            return ExecResult(
                success=False,
                code=code,
                error=result.stderr or result.stdout,
            )
    except subprocess.TimeoutExpired:
        return ExecResult(success=False, code=code, error="执行超时 (30s)")
    except Exception as e:
        return ExecResult(success=False, code=code, error=str(e))

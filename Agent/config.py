"""配置管理 — 读写 ~/.flowing/config.json"""

import json
import os
from pathlib import Path
from typing import Optional

CONFIG_DIR = Path.home() / ".flowing"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_CONFIG = {
    "provider": "tongyi",
    "tongyi": {
        "api_key": "",
        "model": "qwen-plus",
        "endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
    "claude": {
        "api_key": "",
        "model": "claude-sonnet-4-20250514",
    },
    "custom": {
        "api_key": "",
        "model": "",
        "endpoint": "",
    },
}


def load_config() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_config(config: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def setup_wizard() -> dict:
    """交互式配置向导"""
    print("\n=== Flowing Agent 配置向导 ===\n")
    print("选择 LLM 服务商:")
    print("  1) 通义千问 (DashScope)")
    print("  2) Claude (Anthropic)")
    print("  3) 自定义 (OpenAI 兼容接口)")

    choice = input("\n请选择 [1/2/3]: ").strip() or "1"
    config = dict(DEFAULT_CONFIG)

    if choice == "1":
        config["provider"] = "tongyi"
        api_key = input("DashScope API Key: ").strip()
        model = input("模型名称 (回车默认 qwen-plus): ").strip() or "qwen-plus"
        config["tongyi"]["api_key"] = api_key
        config["tongyi"]["model"] = model

    elif choice == "2":
        config["provider"] = "claude"
        print("\nClaude 认证方式:")
        print("  1) API Key (从 console.anthropic.com 获取)")
        print("  2) OAuth 自动授权 (浏览器登录)")
        auth_choice = input("请选择 [1/2]: ").strip() or "1"

        if auth_choice == "2":
            print("\n正在启动 OAuth 授权...")
            from oauth import start_oauth
            token = start_oauth()
            if token:
                config["claude"]["oauth_token"] = token
                save_config(config)
                print("OAuth 授权成功，配置已保存。")
                return config
            else:
                print("OAuth 授权失败，请使用 API Key 方式。")
                api_key = input("Anthropic API Key: ").strip()
                config["claude"]["api_key"] = api_key
        else:
            api_key = input("Anthropic API Key: ").strip()
            model = input("模型 (回车默认 claude-sonnet-4-20250514): ").strip()
            config["claude"]["api_key"] = api_key
            if model:
                config["claude"]["model"] = model

    elif choice == "3":
        config["provider"] = "custom"
        endpoint = input("API Endpoint (如 https://api.openai.com/v1): ").strip()
        api_key = input("API Key: ").strip()
        model = input("模型名称: ").strip()
        config["custom"] = {
            "api_key": api_key,
            "model": model,
            "endpoint": endpoint,
        }

    save_config(config)
    print(f"\n配置已保存到 {CONFIG_FILE}")
    return config

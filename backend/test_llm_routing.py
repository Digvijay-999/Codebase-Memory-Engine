"""Self-check (no network, no LLM quota): whole-repo calls use OPENROUTER_MODEL_LONG with its own fallbacks and
reasoning off; /ask uses the primary chain with no reasoning override. Run from backend/: python test_llm_routing.py"""
import os
from types import SimpleNamespace

import anyio

import services.llm_service as llm

calls = []


class FakeCompletions:
    async def create(self, **kwargs):
        calls.append(kwargs)
        choice = SimpleNamespace(message=SimpleNamespace(content="ok"), finish_reason="stop")
        return SimpleNamespace(id="gen-test", model=kwargs["model"], usage=None, choices=[choice])


llm.get_openai_client = lambda: SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
os.environ.update(OPENROUTER_MODEL="primary:free", OPENROUTER_FALLBACK_MODELS="p-fb:free",
                  OPENROUTER_MODEL_LONG="long:free", OPENROUTER_FALLBACK_MODELS_LONG="l-fb1:free,l-fb2:free")

anyio.run(llm._call_openrouter, "q", 60.0)          # /ask
anyio.run(llm._call_openrouter, "q", 85.0, True)    # whole-repo
ask, whole = calls
assert ask["model"] == "primary:free" and ask["extra_body"] == {"models": ["primary:free", "p-fb:free"]}, ask
assert whole["model"] == "long:free", whole
assert whole["extra_body"] == {"reasoning": {"effort": "none"}, "models": ["long:free", "l-fb1:free", "l-fb2:free"]}, whole

os.environ["OPENROUTER_MODEL_LONG"] = ""  # empty: whole-repo uses the primary chain
anyio.run(llm._call_openrouter, "q", 85.0, True)
assert calls[-1]["model"] == "primary:free" and calls[-1]["extra_body"]["models"] == ["primary:free", "p-fb:free"], calls[-1]
print("OK routing:", ask["model"], "->", ask["extra_body"], "|", whole["model"], "->", whole["extra_body"])

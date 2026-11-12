import importlib.util
import os

spec = importlib.util.spec_from_file_location(
    "eval_retrieval", os.path.join(os.path.dirname(__file__), "..", "scripts", "eval_retrieval.py"))
ev = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ev)

SRC = "class App:\n    def route(self):\n        return 1\n\n    def other(self):\n        return 2\n\n\ndef helper():\n    return 3\n"


def test_hit_needs_overlap_with_a_gold_definition(tmp_path):
    (tmp_path / "app.py").write_text(SRC)
    gold = [{"file": "app.py", "symbol": "App.route"}]
    other = ("# File: app.py\n# Symbols: other\n    def other(self):\n        return 2\n", {"file": "app.py"})
    route = ("# File: app.py\n# Symbols: route\n    def route(self):\n        return 1\n", {"file": "app.py"})
    wrong_file = ("# File: x.py\n    def route(self):\n", {"file": "x.py"})
    missing = []
    # same file but another function is not a hit; the gold function at rank 3 is
    assert ev.first_hit_rank([other, wrong_file, route], gold, str(tmp_path), {}, missing) == 3
    assert ev.first_hit_rank([other, wrong_file], gold, str(tmp_path), {}, missing) is None
    assert missing == []


def test_chunk_from_another_commit_is_reported_not_counted(tmp_path):
    (tmp_path / "app.py").write_text(SRC)
    stale = ("# File: app.py\n    def route(self):\n        return 99\n", {"file": "app.py"})
    missing = []
    assert ev.first_hit_rank([stale], [{"file": "app.py", "symbol": "App.route"}], str(tmp_path), {}, missing) is None
    assert missing == ["app.py"]

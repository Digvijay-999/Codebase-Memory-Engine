import re

from services.content_service import get_repository_context


def _files(context):
    return re.findall(r"^--- (.*) ---$", context, re.M)


def _doc(file, content):
    return {"file": file, "content": content}


DOCS = [
    # walk order puts tests and examples first; the builder must not
    _doc("examples/celery/pyproject.toml", "[project]\nname = 'celery-example'\n"),
    _doc("examples/celery/views.py", "from pkg import app\n"),
    _doc("tests/test_app.py", "from pkg.app import App\nfrom pkg import helpers\n"),
    _doc("src/pkg/rarely.py", "def rarely():\n    pass\n"),
    _doc("src/pkg/helpers.py", "def helper():\n    pass\n"),
    _doc("src/pkg/routing.py", "from .helpers import helper\nimport typing\n"),
    _doc("src/pkg/views.py", "from . import helpers\nfrom pkg.routing import x\n"),
    _doc("src/pkg/app.py", "from .helpers import helper\nfrom .routing import x\n\nclass App:\n    def route(self):\n        pass\n"),
    _doc("src/pkg/typing.py", "X = 1\n"),
    _doc("src/pkg/__init__.py", "from .app import App\n"),
    _doc("pyproject.toml", "[project]\nname = 'pkg'\n"),
    _doc("README.md", "# pkg\nA small web framework.\n"),
]


def test_order_readme_manifest_entry_point_then_most_imported():
    files = _files(get_repository_context(DOCS))
    assert files[:3] == ["README.md", "pyproject.toml", "src/pkg/app.py"]
    # helpers is imported by app, routing, views (3); routing by app, views (2); rarely by nobody
    assert files.index("src/pkg/helpers.py") < files.index("src/pkg/routing.py") < files.index("src/pkg/rarely.py")
    # the stdlib `import typing` does not make src/pkg/typing.py look popular
    assert files.index("src/pkg/typing.py") > files.index("src/pkg/routing.py")
    # tests and examples come after all of the project's own code
    core = [i for i, f in enumerate(files) if f.startswith("src/")]
    aux = [i for i, f in enumerate(files) if f.startswith(("tests/", "examples/"))]
    assert aux and max(core) < min(aux)


def test_nested_manifest_is_not_treated_as_the_project_manifest():
    files = _files(get_repository_context(DOCS))
    assert files.index("examples/celery/pyproject.toml") > files.index("src/pkg/rarely.py")


def test_budget_is_respected_and_long_files_keep_their_definitions():
    body = "\n".join(f"def handler_{i}(request):\n    return {i}\n" + "# filler\n" * 40 for i in range(60))
    docs = DOCS + [_doc("src/pkg/big.py", "from .helpers import helper\n" + body)]
    context = get_repository_context(docs, max_chars=3000)
    assert len(context) <= 3000
    full = get_repository_context(docs)
    big = full.split("--- src/pkg/big.py ---\n", 1)[1].split("\n--- ", 1)[0]
    assert "# Definitions in this file:" in big and "def handler_1(request):" in big

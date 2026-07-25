import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def check(name, fn):
    print(f"\n--- Testing {name} ---")
    try:
        fn()
    except Exception as e:
        print(f"Exception: {e}")

def test_clone_invalid_url():
    res = requests.post(f"{BASE_URL}/clone", json={"repo_url": "https://github.com/invalid/invalid"})
    print("Clone invalid:", res.status_code, res.text)

def test_index_invalid_url():
    res = requests.post(f"{BASE_URL}/index", json={"repo_url": "https://github.com/invalid/invalid"})
    print("Index invalid:", res.status_code, res.text)

def test_ask_invalid_repo():
    res = requests.post(f"{BASE_URL}/ask", json={"repo_name": "doesntexist", "question": "hello?"})
    print("Ask invalid repo:", res.status_code, res.text)

def test_explain_invalid_repo():
    res = requests.post(f"{BASE_URL}/explain", json={"repo_name": "doesntexist"})
    print("Explain invalid repo:", res.status_code, res.text)

def test_readme_invalid_repo():
    res = requests.post(f"{BASE_URL}/generate-readme", json={"repo_name": "doesntexist"})
    print("Readme invalid repo:", res.status_code, res.text)

check("Clone Invalid URL", test_clone_invalid_url)
check("Index Invalid URL", test_index_invalid_url)
check("Ask Invalid Repo", test_ask_invalid_repo)
check("Explain Invalid Repo", test_explain_invalid_repo)
check("Readme Invalid Repo", test_readme_invalid_repo)

import sys
from pathlib import Path
from collections import Counter
import argparse

# Force UTF-8 on Windows stdout/stderr
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import chromadb
from config.settings import CHROMA_DB_PATH


def main():
    parser = argparse.ArgumentParser(description="ChromaDB Legacy Vector Cleanup Tool")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Simulate cleanup and print counts without deleting any records."
    )
    args = parser.parse_args()

    print("==================================================")
    print("CONTEXTFORGE — CHROMADB LEGACY VECTOR CLEANUP")
    print("==================================================")
    print(f"Target Database: {CHROMA_DB_PATH}")

    # 1. Open persistent client & collection
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name="codebase")

    # 2. Inspect metadata and IDs only
    total_before = collection.count()
    print(f"Total documents before cleanup: {total_before}")

    data = collection.get(include=["metadatas"])
    all_ids = data.get("ids", [])
    all_metas = data.get("metadatas", [])

    orphan_ids = []
    valid_ids = []
    valid_repos = Counter()

    for doc_id, meta in zip(all_ids, all_metas):
        if not meta:
            orphan_ids.append(doc_id)
            continue

        repo = meta.get("repo_name")
        if repo is None or not str(repo).strip():
            orphan_ids.append(doc_id)
        else:
            valid_ids.append(doc_id)
            valid_repos[str(repo).strip()] += 1

    print("\n--- INVENTORY SUMMARY ---")
    print(f"Total documents inspected:        {len(all_ids)}")
    print(f"Documents with valid repo_name:   {len(valid_ids)}")
    print(f"Orphan documents (no repo_name):  {len(orphan_ids)}")
    print(f"Unique valid repositories ({len(valid_repos)}):")
    for repo, count in sorted(valid_repos.items()):
        print(f"  - {repo:30s}: {count:5d} chunks")

    # Dry-run handling
    if args.dry_run:
        print("\n==================================================")
        print("[DRY-RUN MODE] NO DELETIONS WERE PERFORMED.")
        print(f"Projected remaining documents: {len(valid_ids)}")
        print(f"Projected deleted documents:   {len(orphan_ids)}")
        print("==================================================")

        # Verify collection readability & semantic search during dry-run
        _verify_collection_and_search(collection, valid_repos)
        return

    if len(orphan_ids) == 0:
        print("\nNo orphan documents found. Database is already clean.")
        return

    # Safety confirmation prompt
    print("\n==================================================")
    print("SAFETY CONFIRMATION REQUIRED")
    print("==================================================")
    print(f"ABOUT TO DELETE {len(orphan_ids)} DOCUMENTS WITH NO repo_name. Valid repository vectors will NOT be touched.")
    print("To proceed, type exactly: DELETE LEGACY CHUNKS")
    user_input = input("Confirmation: ").strip()

    if user_input != "DELETE LEGACY CHUNKS":
        print("\nConfirmation mismatch. Aborting operation. No documents were deleted.")
        return

    # Batch deletion of orphan IDs
    print(f"\nDeleting {len(orphan_ids)} orphan documents in batches...")
    BATCH_SIZE = 500
    deleted_count = 0

    for i in range(0, len(orphan_ids), BATCH_SIZE):
        batch = orphan_ids[i:i + BATCH_SIZE]
        collection.delete(ids=batch)
        deleted_count += len(batch)
        print(f"  Deleted batch {i // BATCH_SIZE + 1} ({deleted_count}/{len(orphan_ids)})...")

    # Post-deletion verification
    total_after = collection.count()
    print("\n==================================================")
    print("CLEANUP COMPLETED — VERIFICATION")
    print("==================================================")
    print(f"Documents deleted:    {deleted_count}")
    print(f"Documents remaining:  {total_after}")
    print(f"Valid repositories:   {len(valid_repos)}")

    # Verify zero orphans remain
    post_data = collection.get(include=["metadatas"])
    remaining_metas = post_data.get("metadatas", [])
    remaining_orphans = sum(
        1 for m in remaining_metas
        if not m or not m.get("repo_name") or not str(m.get("repo_name")).strip()
    )

    print(f"Remaining documents without repo_name: {remaining_orphans}")
    assert remaining_orphans == 0, f"Error: Found {remaining_orphans} orphan documents after cleanup!"
    assert total_after == len(valid_ids), f"Count mismatch: expected {len(valid_ids)}, got {total_after}"
    print("[PASS] Verified 0 orphan documents remain.")

    # Verify collection accessibility and semantic search
    _verify_collection_and_search(collection, valid_repos)
    print("\nChromaDB cleanup and verification completed successfully.")


def _verify_collection_and_search(collection, valid_repos):
    print("\n--- VERIFYING SEARCH INTEGRITY ---")
    current_count = collection.count()
    print(f"Chroma collection count: {current_count} documents")
    
    # Verify repository chunk counts
    post_data = collection.get(include=["metadatas"])
    post_metas = post_data.get("metadatas", [])
    current_repos = Counter()
    for m in post_metas:
        if m and m.get("repo_name"):
            current_repos[str(m.get("repo_name")).strip()] += 1

    print("\nPost-cleanup repository inventory:")
    for repo, count in sorted(current_repos.items()):
        original_count = valid_repos.get(repo, 0)
        match_str = "[OK]" if count == original_count else "[MISMATCH]"
        print(f"  {match_str} {repo:30s}: {count:5d} chunks (expected {original_count:5d})")
        assert count == original_count, f"Repository {repo} count changed from {original_count} to {count}!"

    # Verify semantic search on required repositories
    test_repos = ["flask", "codebase-memory-engine"]
    from services.embedding_service import search_chunks

    for test_repo in test_repos:
        if test_repo in current_repos:
            print(f"\nTesting semantic search on repository '{test_repo}'...")
            try:
                results = search_chunks("FastAPI router or Flask application", test_repo, n_results=2)
                retrieved = len(results.get("documents", []))
                print(f"[PASS] Semantic search returned {retrieved} chunks for '{test_repo}'.")
                if results.get("metadatas") and len(results["metadatas"]) > 0:
                    print(f"       Top source: {results['metadatas'][0].get('file')}")
                assert retrieved > 0, f"Semantic search returned 0 results for '{test_repo}'!"
            except Exception as e:
                print(f"[FAIL] Semantic search verification failed for '{test_repo}': {e}")
                raise


if __name__ == "__main__":
    main()

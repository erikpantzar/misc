import json
import sys
from pathlib import Path

SLIDE_KEYS = ["id", "order", "chapter", "theme", "seconds", "fixed_seconds", "qa", "appendix", "script", "change", "todo", "status", "cut", "cut_reason"]
TOPIC_KEYS = ["id", "order", "title", "note", "slides"]
META_KEYS = ["title", "wpm", "budget_seconds", "qa_seconds"]

if len(sys.argv) != 3:
    sys.exit("usage: python3 sync-talk.py <readback dir with meta/ slides/ topics/> <talk.json>")

readback, out_path = Path(sys.argv[1]), Path(sys.argv[2])


def ordered(doc, keys):
    return {**{k: doc[k] for k in keys if k in doc}, **{k: v for k, v in doc.items() if k not in keys}}


def load(collection, keys):
    docs = [json.loads(p.read_text()) for p in sorted((readback / collection).glob("*.json"))]
    if not docs:
        sys.exit(f"no docs in {readback / collection}")
    return sorted((ordered(d, keys) for d in docs), key=lambda d: (d.get("order", 0), d["id"]))


meta = ordered(json.loads((readback / "meta" / "talk.json").read_text()), META_KEYS)
talk = {"meta": meta, "slides": load("slides", SLIDE_KEYS), "topics": load("topics", TOPIC_KEYS)}
out_path.write_text(json.dumps(talk, ensure_ascii=False, indent=1) + "\n")
print(f"{len(talk['slides'])} slides, {len(talk['topics'])} topics written to {out_path}")

"""
server.py — CBSE Class 9 Study Dashboard Backend
=================================================
• aiohttp async server listening on 0.0.0.0:8765
  (accessible on localhost:8765 AND from mobile phone via local Wi-Fi IP)
• Dual-checkbox schema for topics: `taught` (Class/Lecture) & `revised` (Self-Study)
• REST API: GET /api/data  |  POST /api/mutate
• SSE push stream: GET /api/events
• Automatic midnight reset for daily routine tasks
• Debounced disk writes (500 ms) using aiofiles
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import socket
import uuid
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional, Set

import aiofiles
import aiohttp
from aiohttp import web

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s UTC [%(levelname)s] studydash: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("studydash")

# ── Paths & Config ────────────────────────────────────────────────────────────
HERE      = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(HERE, "data.json")
CFG_FILE  = os.path.join(HERE, "config.json")
PORT      = 8765


def _get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _load_config() -> Dict:
    try:
        with open(CFG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


CONFIG     = _load_config()
CLOUD_BASE = CONFIG.get("cloud_api_url", "")
CLOUD_KEY  = CONFIG.get("cloud_api_key", "")


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


# ══════════════════════════════════════════════════════════════════════════════
# Seed Data  —  CBSE Class 9 (12 Subjects, 100 Topics with Taught & Revised)
# ══════════════════════════════════════════════════════════════════════════════
def _build_seed(now: str) -> Dict[str, Any]:
    subjects: List[Dict] = [
        {"id": "s1",  "name": "Physics",     "order_index": 0,  "color": "#7c3aed", "abbr": "PHY"},
        {"id": "s2",  "name": "Chemistry",   "order_index": 1,  "color": "#0891b2", "abbr": "CHE"},
        {"id": "s3",  "name": "Biology",     "order_index": 2,  "color": "#059669", "abbr": "BIO"},
        {"id": "s4",  "name": "Mathematics", "order_index": 3,  "color": "#e11d48", "abbr": "MAT"},
        {"id": "s5",  "name": "English",     "order_index": 4,  "color": "#9333ea", "abbr": "ENG"},
        {"id": "s6",  "name": "Hindi",       "order_index": 5,  "color": "#c2410c", "abbr": "HIN"},
        {"id": "s7",  "name": "Marathi",     "order_index": 6,  "color": "#4f46e5", "abbr": "MAR"},
        {"id": "s8",  "name": "History",     "order_index": 7,  "color": "#d97706", "abbr": "HIS"},
        {"id": "s9",  "name": "Geography",   "order_index": 8,  "color": "#2563eb", "abbr": "GEO"},
        {"id": "s10", "name": "Civics",      "order_index": 9,  "color": "#dc2626", "abbr": "CIV"},
        {"id": "s11", "name": "Economics",   "order_index": 10, "color": "#9f580a", "abbr": "ECO"},
        {"id": "s12", "name": "IT",          "order_index": 11, "color": "#0d9488", "abbr": "IT"},
    ]

    # Topics (subject_id, chapter_name, taught, revised)
    topics_raw: List[tuple] = [
        # Physics
        ("s1", "Describing Motion Around Us",                       False, False),
        ("s1", "How Forces Affect Motion",                          False, False),
        ("s1", "Work, Energy and Simple Machines",                  False, False),
        ("s1", "Sound Waves: Characteristics and Applications",     False, False),

        # Chemistry
        ("s2", "Exploring Mixtures and Their Separation",           False, False),
        ("s2", "Journey Inside the Atom",                           False, False),
        ("s2", "Atomic Foundations of Matter",                      False, False),

        # Biology
        ("s3", "Exploration: Entering the World of Secondary Science", False, False),
        ("s3", "Cell: The Building Blocks of Life",                 False, False),
        ("s3", "Tissues in Action",                                 False, False),
        ("s3", "Reproduction: How Life Continues",                  False, False),
        ("s3", "Patterns in Life: Diversity and Classification",    False, False),
        ("s3", "Earth as a System: Energy, Matter and Life",        False, False),

        # Mathematics (Term 1 & 2)
        ("s4", "Orienting Yourself: The Use of Coordinates",        False, False),
        ("s4", "Introduction to Linear Polynomials",                False, False),
        ("s4", "The World of Numbers",                              False, False),
        ("s4", "Exploring Algebraic Identities",                    False, False),
        ("s4", "I'm Up and Down, and Round and Round",              False, False),
        ("s4", "Measuring Space: Perimeter and Area",               False, False),
        ("s4", "Introduction to Probability",                       False, False),
        ("s4", "Exploring Sequences and Progressions",              False, False),
        ("s4", "Introduction to Euclid's Geometry",                 False, False),
        ("s4", "Lines and Angles",                                  False, False),
        ("s4", "Triangles: Congruence Theorems",                    False, False),
        ("s4", "Quadrilaterals",                                    False, False),
        ("s4", "Linear Equations in Two Variables",                 False, False),
        ("s4", "Mensuration – Surface Area and Volume",             False, False),
        ("s4", "Statistics",                                        False, False),

        # English
        ("s5", "How I Taught My Grandmother to Read",               False, False),
        ("s5", "The Pot Maker",                                     False, False),
        ("s5", "Winds of Change",                                   False, False),
        ("s5", "Vitamin-M",                                         False, False),
        ("s5", "The World of Limitless Possibilities",              False, False),
        ("s5", "Twin Melodies",                                     False, False),
        ("s5", "Carrier of Words",                                  False, False),
        ("s5", "Follow That Dream",                                 False, False),
        ("s5", "Grammar",                                           False, False),
        ("s5", "Writing Skills",                                    False, False),
        ("s5", "Reading Comprehension",                             False, False),

        # Hindi
        ("s6", "Prose: दो बैलों की कथा",                            False, False),
        ("s6", "Prose: क्या लिखूँ?",                                False, False),
        ("s6", "Prose: संवादहीन",                                   False, False),
        ("s6", "Prose: ऐसी भी बातें होती हैं",                      False, False),
        ("s6", "Prose: आखिरी चट्टान तक",                           False, False),
        ("s6", "Prose: रीढ़ की हड्डी",                              False, False),
        ("s6", "Prose: मैं और मेरा देश",                            False, False),
        ("s6", "Poetry: रैदास के पद",                               False, False),
        ("s6", "Poetry: राम-लक्ष्मण-परशुराम संवाद",                 False, False),
        ("s6", "Poetry: भारति, जय, विजयकरे!",                      False, False),
        ("s6", "Poetry: झाँसी की रानी",                             False, False),
        ("s6", "Poetry: घर की याद",                                 False, False),
        ("s6", "Supp: निर्मल जीव सिंह 'सेवा'",                      False, False),
        ("s6", "Supp: सब याद तुम्हारी आती हैं",                     False, False),
        ("s6", "Grammar",                                           False, False),
        ("s6", "Writing Skills",                                    False, False),
        ("s6", "Reading Comprehension",                             False, False),

        # Marathi
        ("s7", "सर्वात्मका शिवसुंदरा",                               False, False),
        ("s7", "संतवाणी",                                            False, False),
        ("s7", "बेटा मी ऐकतो आहे",                                  False, False),
        ("s7", "जी.आय.पी. रेल्वे",                                  False, False),
        ("s7", "व्यायामाचे महत्त्व",                                 False, False),
        ("s7", "ऑलिंपिक वर्तुळाचा गोफ",                             False, False),
        ("s7", "दिव्याच्या शोधामागचे दिव्य",                         False, False),
        ("s7", "उजाड उघडे माळरानही",                                False, False),
        ("s7", "कुलूप",                                              False, False),
        ("s7", "आभाळातल्या पाऊलवाटा",                               False, False),
        ("s7", "पुन्हा एकदा",                                        False, False),
        ("s7", "टिपफूल",                                             False, False),
        ("s7", "माझे शिक्षक आणि संस्कार",                           False, False),
        ("s7", "शब्दांचा खेळ",                                      False, False),
        ("s7", "Supplementary Reading",                             False, False),
        ("s7", "Grammar",                                           False, False),
        ("s7", "Writing Skills",                                    False, False),
        ("s7", "Reading Comprehension",                             False, False),

        # History
        ("s8", "Early Humans and Beginning of Civilisation",        False, False),
        ("s8", "State and Society (upto 1000 CE)",                  False, False),
        ("s8", "Resistance and Resilience (1000 CE–1700 CE)",       False, False),
        ("s8", "India and the World-I (1900 BCE–1200 CE)",          False, False),

        # Geography
        ("s9", "Understanding Social Science",                      False, False),
        ("s9", "Shaping of the Earth's Surface",                    False, False),
        ("s9", "Atmosphere and Climate",                            False, False),
        ("s9", "Oceans and Life",                                   False, False),
        ("s9", "Life on Earth",                                     False, False),

        # Civics
        ("s10", "Democracy",                                        False, False),
        ("s10", "Elections",                                        False, False),
        ("s10", "Authority",                                        False, False),

        # Economics
        ("s11", "Building Blocks in Economics",                     False, False),
        ("s11", "The Price Puzzle: What Drives the Market",         False, False),
        ("s11", "From Ideas to Startups",                           False, False),
        ("s11", "Smart Ways to Manage Your Finances",               False, False),

        # IT
        ("s12", "ES: Communication Skills-I",                       False, False),
        ("s12", "ES: Self-Management Skills-I",                     False, False),
        ("s12", "ES: ICT Skills-I",                                 False, False),
        ("s12", "ES: Entrepreneurial Skills-I",                     False, False),
        ("s12", "ES: Green Skills-I",                               False, False),
        ("s12", "SS: Introduction to IT–ITeS Industry",             False, False),
        ("s12", "SS: Data Entry & Keyboarding Skills",              False, False),
        ("s12", "SS: Digital Documentation",                        False, False),
        ("s12", "SS: Electronic Spreadsheet",                       False, False),
        ("s12", "SS: Digital Presentation",                         False, False),
    ]

    topics: List[Dict] = [
        {
            "id":         f"t{i+1}",
            "subject_id": sid,
            "name":       name,
            "taught":     taught,    # Checkbox 1: Taught in Class / Lecture
            "revised":    revised,   # Checkbox 2: Self-Study / Revision
            "updated_at": now,
        }
        for i, (sid, name, taught, revised) in enumerate(topics_raw)
    ]

    weekly_raw: List[tuple] = [
        ("s1",  "Solve 20 numericals – Motion chapter",             False),
        ("s1",  "Derive Force laws – write 3 times",                False),
        ("s2",  "Separation techniques – diagram practice",         False),
        ("s2",  "Atomic models comparison table",                   False),
        ("s3",  "Draw & label Cell diagram (plant + animal)",       False),
        ("s3",  "Tissues – comparison chart",                       False),
        ("s4",  "Coordinate Geometry – 15 graph sums",              False),
        ("s4",  "Polynomials – factor theorem 10 problems",         False),
        ("s4",  "Lines & Angles theorem proofs – write twice",      False),
        ("s5",  "Write summary: How I Taught My Grandmother",       False),
        ("s5",  "Grammar exercises – tenses worksheet",             False),
        ("s6",  "दो बैलों की कथा – प्रश्न उत्तर लिखो",              False),
        ("s6",  "कविता पाठ – रैदास के पद याद करो",                 False),
        ("s7",  "पाठ 1 – प्रश्नोत्तर लेखन",                         False),
        ("s7",  "Nibandh: व्यायामाचे महत्त्व (300 words)",           False),
        ("s8",  "Early Civilisations – timeline poster",            False),
        ("s8",  "State & Society – notes + key dates",              False),
        ("s9",  "Earth's surface – diagram labelling",              False),
        ("s9",  "Climate zones – map work",                         False),
        ("s10", "Democracy – MCQ practice (30 Qs)",                 False),
        ("s10", "Authority chapter – short notes",                  False),
        ("s11", "Economics vocab flashcards (20 terms)",            False),
        ("s11", "Price puzzle – case study analysis",               False),
        ("s12", "Create MS Word formatted document",                False),
        ("s12", "MS Excel – marks grade calculator sheet",          False),
    ]

    weekly_tasks: List[Dict] = [
        {
            "id":         f"w{i+1}",
            "subject_id": sid,
            "task":       task,
            "done":       done,
            "updated_at": now,
        }
        for i, (sid, task, done) in enumerate(weekly_raw)
    ]

    daily_tasks: List[Dict] = [
        {"id": "d1", "task": "Morning Revision (30 min)",           "done": False, "updated_at": now},
        {"id": "d2", "task": "90-min Deep Work – Block 1",          "done": False, "updated_at": now},
        {"id": "d3", "task": "Solve 10 MCQs from weakest subject",  "done": False, "updated_at": now},
        {"id": "d4", "task": "90-min Deep Work – Block 2",          "done": False, "updated_at": now},
        {"id": "d5", "task": "Evening Formula / Vocab Review",      "done": False, "updated_at": now},
        {"id": "d6", "task": "No Phone during study blocks 🚫",     "done": False, "updated_at": now},
        {"id": "d7", "task": "Drink 2L Water 💧",                   "done": False, "updated_at": now},
        {"id": "d8", "task": "Write tomorrow's study plan 📝",      "done": False, "updated_at": now},
        {"id": "d9", "task": "8 Hours Sleep 🌙",                    "done": False, "updated_at": now},
    ]

    return {
        "subjects":     subjects,
        "topics":       topics,
        "weekly_tasks": weekly_tasks,
        "daily_tasks":  daily_tasks,
        "_meta": {
            "last_sync": None,
            "last_date": date.today().isoformat(),
            "version":   3,
            "schema":    "taught_revised",
            "created_at": now,
        },
    }


def _check_daily_reset(data: Dict) -> bool:
    today = date.today().isoformat()
    last  = data.get("_meta", {}).get("last_date", "")
    if last == today:
        return False
    ts = _now_utc()
    for task in data.get("daily_tasks", []):
        task["done"]       = False
        task["updated_at"] = ts
    data["_meta"]["last_date"] = today
    log.info("Daily tasks reset for %s", today)
    return True


class AppState:
    def __init__(self) -> None:
        self.data: Dict[str, Any]              = {}
        self._write_task: Optional[asyncio.Task] = None
        self._sse_queues: Set[asyncio.Queue]   = set()

    async def load(self) -> None:
        if os.path.exists(DATA_FILE):
            async with aiofiles.open(DATA_FILE, encoding="utf-8") as f:
                raw = await f.read()
            self.data = json.loads(raw)
            self._migrate_schema()
            reset = _check_daily_reset(self.data)
            if reset:
                await self._flush()
            log.info("Loaded %d topics from data.json", len(self.data.get("topics", [])))
        else:
            now       = _now_utc()
            self.data = _build_seed(now)
            await self._flush()
            log.info("Seeded new data.json with %d topics", len(self.data["topics"]))

    def _migrate_schema(self) -> None:
        migrated = False
        for t in self.data.get("topics", []):
            if "taught" not in t:
                t["taught"]  = t.get("studied", t.get("done", False))
                migrated     = True
            if "revised" not in t:
                t["revised"] = t.get("mastered", False)
                migrated     = True
        if migrated:
            log.info("Schema migration: updated topics to taught & revised")

    def schedule_write(self) -> None:
        if self._write_task and not self._write_task.done():
            self._write_task.cancel()
        self._write_task = asyncio.create_task(self._debounced_write())

    async def _debounced_write(self) -> None:
        await asyncio.sleep(0.5)
        await self._flush()

    async def _flush(self) -> None:
        payload = json.dumps(self.data, ensure_ascii=False, indent=2)
        async with aiofiles.open(DATA_FILE, "w", encoding="utf-8") as f:
            await f.write(payload)

    def add_sse_queue(self, q: asyncio.Queue) -> None:
        self._sse_queues.add(q)

    def remove_sse_queue(self, q: asyncio.Queue) -> None:
        self._sse_queues.discard(q)

    async def broadcast(self, event: str, payload: Dict | None = None) -> None:
        msg = {"event": event, "data": payload or {}}
        dead = set()
        for q in list(self._sse_queues):
            try:
                q.put_nowait(msg)
            except asyncio.QueueFull:
                dead.add(q)
        for q in dead:
            self._sse_queues.discard(q)


state = AppState()

_TABLE_MAP = {
    "topic":       "topics",
    "weekly_task": "weekly_tasks",
    "daily_task":  "daily_tasks",
    "subject":     "subjects",
}


def _apply_mutation(data: Dict, mut: Dict) -> Dict:
    action = mut.get("action")
    entity = mut.get("entity")
    ts     = _now_utc()

    table = _TABLE_MAP.get(entity, "")
    if table and table not in data:
        data[table] = []

    if action == "update":
        rid   = mut["id"]
        field = mut["field"]
        value = mut["value"]

        if isinstance(value, str):
            if value.lower() == "true":
                value = True
            elif value.lower() == "false":
                value = False

        target = next((r for r in data.get(table, []) if r["id"] == rid), None)
        if not target:
            raise ValueError(f"Record {rid} not found in {table}")

        target[field]        = value
        target["updated_at"] = ts

    elif action == "add":
        d = dict(mut.get("data", {}))
        if "id" not in d:
            prefix = {"topic": "t", "weekly_task": "w", "daily_task": "d"}.get(entity, "x")
            d["id"] = prefix + uuid.uuid4().hex[:8]
        d.setdefault("updated_at", ts)
        if entity == "topic":
            d.setdefault("taught",  False)
            d.setdefault("revised", False)
        elif entity in ("weekly_task", "daily_task"):
            d.setdefault("done", False)
        data[table].append(d)

    elif action == "remove":
        rid = mut["id"]
        data[table] = [r for r in data.get(table, []) if r["id"] != rid]

    else:
        raise ValueError(f"Unknown action: {action}")

    return data


async def handle_data(req: web.Request) -> web.Response:
    if _check_daily_reset(state.data):
        state.schedule_write()
        await state.broadcast("data-updated", {"timestamp": _now_utc()})
    return web.json_response(state.data)


async def handle_mutate(req: web.Request) -> web.Response:
    try:
        mut = await req.json()
    except json.JSONDecodeError:
        return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)

    try:
        _apply_mutation(state.data, mut)
    except (ValueError, KeyError) as e:
        return web.json_response({"ok": False, "error": str(e)}, status=422)

    state.schedule_write()
    await state.broadcast("data-mutated", {
        "entity":    mut.get("entity"),
        "id":        mut.get("id"),
        "timestamp": _now_utc(),
    })
    return web.json_response({"ok": True, "data": state.data})


async def handle_events(req: web.Request) -> web.StreamResponse:
    resp = web.StreamResponse(headers={
        "Content-Type":                "text/event-stream",
        "Cache-Control":               "no-cache",
        "X-Accel-Buffering":           "no",
        "Access-Control-Allow-Origin": "*",
    })
    await resp.prepare(req)

    q: asyncio.Queue = asyncio.Queue(maxsize=50)
    state.add_sse_queue(q)

    await resp.write(b"event: connected\ndata: {}\n\n")

    try:
        while True:
            try:
                msg = await asyncio.wait_for(q.get(), timeout=25)
                evt  = msg["event"]
                data = json.dumps(msg["data"])
                await resp.write(f"event: {evt}\ndata: {data}\n\n".encode())
            except asyncio.TimeoutError:
                await resp.write(b"event: heartbeat\ndata: {}\n\n")
    except (ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        state.remove_sse_queue(q)
    return resp


async def handle_static(req: web.Request) -> web.FileResponse:
    filename = req.match_info.get("filename", "index.html")
    if not filename:
        filename = "index.html"
    filepath = os.path.join(HERE, filename)
    if not os.path.exists(filepath):
        raise web.HTTPNotFound()
    return web.FileResponse(filepath)


async def cors_middleware(app: web.Application, handler):
    async def middleware(request: web.Request) -> web.Response:
        if request.method == "OPTIONS":
            return web.Response(headers={
                "Access-Control-Allow-Origin":  "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            })
        resp = await handler(request)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
    return middleware


async def on_startup(app: web.Application) -> None:
    await state.load()


async def on_cleanup(app: web.Application) -> None:
    if state._write_task and not state._write_task.done():
        state._write_task.cancel()
        await state._flush()


def build_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)

    app.router.add_get("/api/data",     handle_data)
    app.router.add_post("/api/mutate",  handle_mutate)
    app.router.add_get("/api/events",   handle_events)

    app.router.add_get("/",              handle_static)
    app.router.add_get("/{filename:.+}", handle_static)

    return app


if __name__ == "__main__":
    local_ip = _get_local_ip()
    app = build_app()
    log.info("=" * 65)
    log.info("  CBSE Class 9 Study Dashboard Running!")
    log.info("  • Computer Access:   http://localhost:%d", PORT)
    log.info("  • Mobile Access:     http://%s:%d", local_ip, PORT)
    log.info("=" * 65)
    web.run_app(app, host="0.0.0.0", port=PORT, access_log=None)

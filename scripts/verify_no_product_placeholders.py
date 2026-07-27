import json
import re
import sys
from pathlib import Path

repo = Path(".").resolve()
data = json.loads(
    (repo / "src/lib/catalog/product-images.json").read_text(encoding="utf-8")
)
MAX = 6


def is_ph(src: str) -> bool:
    t = src.strip().replace("\\", "/")
    n = t if t.startswith("/") else "/" + t
    if re.match(
        r"/images/(pages/|site/hero\.svg$|products/[^/]+\.svg$|projects/[^/]+\.svg$)",
        n,
        re.I,
    ):
        return True
    return "reemplazar con foto propia" in n.lower() or bool(
        re.search(r"/pages/(projects|products)(\.svg)?$", n, re.I)
    )


def is_project(src: str) -> bool:
    n = src.replace("\\", "/").lower()
    return "/gallery/" in n and ("/projects/" in n or "/project/" in n)


def is_admin(src: str) -> bool:
    return bool(
        re.search(
            r"/gallery/[^/]+/[^/]+/[^/]+-\d{13}\.[a-z0-9]+$",
            src.replace("\\", "/"),
            re.I,
        )
    )


def normalize(images):
    pc = sum(
        1
        for i in images
        if is_project(i["src"]) or i.get("source") == "project"
    )
    ac = sum(1 for i in images if is_admin(i["src"]))
    non = len(images) - ac
    legacy = non >= MAX or (pc >= 10 and non > 0)
    out = []
    for image in images:
        if is_project(image["src"]) or image.get("source") == "project":
            out.append({**image, "source": "project"})
        elif is_admin(image["src"]):
            out.append({**image, "source": "product", "caption": ""})
        elif legacy:
            out.append({**image, "source": "project"})
        else:
            out.append({**image, "source": "product", "caption": ""})
    return out


def exists(src: str) -> bool:
    return (repo / "public" / src.lstrip("/")).exists()


def product_gallery(cat: str, sub: str):
    raw = (data.get("galleries") or {}).get(cat, {}).get(sub) or []
    products = [
        i
        for i in normalize(raw if isinstance(raw, list) else [])
        if i.get("source") == "product"
    ]
    products = [
        i for i in products if (not is_ph(i["src"])) and exists(i["src"])
    ]
    if products:
        return products[:MAX]
    cover = (data.get("subcategories") or {}).get(cat, {}).get(sub)
    if cover and (not is_ph(cover)) and exists(cover):
        return [{"src": cover, "source": "product"}]
    return []


failed = False
for cat, sub in [("facades", "curtainWallStick"), ("facades", "stickRpt")]:
    g = product_gallery(cat, sub)
    bad = [
        i
        for i in g
        if is_ph(i["src"])
        or "pages/projects" in i["src"]
        or "pages/products" in i["src"]
    ]
    print(
        json.dumps(
            {
                "cat": cat,
                "sub": sub,
                "count": len(g),
                "srcs": [i["src"] for i in g],
                "ok": not bad,
            }
        )
    )
    if bad:
        failed = True

poisoned = [
    {"src": "/images/pages/projects.svg", "source": "product"},
    {"src": "/images/pages/products.svg", "source": "product"},
    {
        "src": "/images/products/gallery/facades/curtainWallStick/Stik-1785190978065.jpeg",
        "source": "product",
    },
]
kept = [i for i in poisoned if (not is_ph(i["src"])) and exists(i["src"])]
print("poison_kept", kept)
assert is_ph("/images/pages/projects.svg") and is_ph(
    "/images/pages/products.svg"
)
assert not kept
cover = "/images/products/facades/curtainWallStick.jpeg"
preview = [cover] if exists(cover) and (not is_ph(cover)) else []
print("stick_preview", preview)
assert preview == [cover]
if failed:
    sys.exit(1)
print("OK: STICK sin placeholders pages/projects ni pages/products")

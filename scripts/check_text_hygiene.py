from __future__ import annotations

import subprocess
import sys
from pathlib import Path


LF_SUFFIXES = {
    ".go",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".yml",
    ".yaml",
    ".md",
    ".css",
    ".scss",
    ".html",
    ".sh",
    ".sql",
}

CRLF_SUFFIXES = {
    ".ps1",
    ".bat",
    ".cmd",
}

LF_FILENAMES = {
    ".editorconfig",
    ".gitattributes",
    ".gitignore",
}


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    raw_paths = [item for item in result.stdout.decode("utf-8").split("\x00") if item]
    return [Path(item) for item in raw_paths]


def expected_eol(path: Path) -> str | None:
    if path.name in LF_FILENAMES:
        return "lf"
    if path.suffix.lower() in LF_SUFFIXES:
        return "lf"
    if path.suffix.lower() in CRLF_SUFFIXES:
        return "crlf"
    return None


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    expected = expected_eol(path)
    if expected is None:
        return errors

    data = path.read_bytes()

    try:
        data.decode("utf-8")
    except UnicodeDecodeError as exc:
        errors.append(f"{path}: not valid UTF-8 ({exc})")
        return errors

    if data.startswith(b"\xef\xbb\xbf"):
        errors.append(f"{path}: UTF-8 BOM is not allowed")

    if b"\r\r\n" in data:
        errors.append(f"{path}: contains malformed CRCRLF line endings")

    if expected == "lf":
        if b"\r\n" in data:
            errors.append(f"{path}: expected LF line endings")
        if b"\r" in data.replace(b"\r\n", b""):
            errors.append(f"{path}: contains stray CR characters")
    else:
        if b"\r" in data.replace(b"\r\n", b""):
            errors.append(f"{path}: contains stray CR characters")
        newline_count = data.count(b"\n")
        crlf_count = data.count(b"\r\n")
        if newline_count != crlf_count:
            errors.append(f"{path}: expected CRLF line endings")

    return errors


def main() -> int:
    failures: list[str] = []
    for path in tracked_files():
        failures.extend(validate_file(path))

    if failures:
        print("Text hygiene check failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("Text hygiene check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

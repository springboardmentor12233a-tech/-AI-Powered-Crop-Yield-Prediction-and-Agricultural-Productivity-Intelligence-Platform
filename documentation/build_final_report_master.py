# -*- coding: utf-8 -*-
"""
AgriYield AI — Master Document Builder
Compiles all chapters and 24 images into AgriYield_AI_Final_Project_Report_OVS_VARUN.docx
"""

import sys
from pathlib import Path

# Add project root to sys.path so modules import reliably
ROOT_DIR = Path("/home/ramakrishna/Desktop/Projects/AgriYield_AI")
sys.path.insert(0, str(ROOT_DIR))

from documentation.report_sections.common import (
    setup_document, OUTPUT_FILE
)
from documentation.report_sections.cover_and_toc import (
    add_cover_page, add_table_of_contents
)
from documentation.report_sections.ch1_to_ch5 import write_chapters_1_to_5
from documentation.report_sections.ch6_farmer_experience import write_chapter_6
from documentation.report_sections.ch7_admin_experience import write_chapter_7
from documentation.report_sections.ch8_to_ch10 import write_chapters_8_to_10
from documentation.report_sections.ch11_to_ch15 import write_chapters_11_to_15


def build_final_report():
    print("=" * 60)
    print("AgriYield AI — Generating Final Project Report DOCX")
    print("Author: OVS VARUN")
    print(f"Target: {OUTPUT_FILE}")
    print("=" * 60)

    doc = setup_document()

    print("[1/7] Building Cover Page...")
    add_cover_page(doc)

    print("[2/7] Generating Table of Contents & List of Figures (24 Figures)...")
    add_table_of_contents(doc)

    print("[3/7] Writing Chapters 1 to 5 (Executive Summary, Architecture, ML Pipeline, Modules)...")
    write_chapters_1_to_5(doc)

    print("[4/7] Writing Chapter 6: Farmer Experience & Screen Walkthrough (Figures 1 to 17)...")
    write_chapter_6(doc)

    print("[5/7] Writing Chapter 7: Administrator Experience & Governance (Figures 18 to 21)...")
    write_chapter_7(doc)

    print("[6/7] Writing Chapters 8 to 10: Backend APIs, Testing Evidence (Figures 22 to 24) & Security...")
    write_chapters_8_to_10(doc)

    print("[7/7] Writing Chapters 11 to 15: Results, Limitations, Roadmap, Conclusion & References...")
    write_chapters_11_to_15(doc)

    print("Saving completed document to disk...")
    doc.save(OUTPUT_FILE)
    print(f"SUCCESS: Document saved successfully at: {OUTPUT_FILE}")
    print(f"File size: {OUTPUT_FILE.stat().st_size:,} bytes")
    print("=" * 60)


if __name__ == "__main__":
    build_final_report()

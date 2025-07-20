#!/usr/bin/env python3
import yaml
from collections import defaultdict
import random

def load_rules():
    with open('apps/server/src/rules/rule-based.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def save_rules(rules):
    with open('apps/server/src/rules/rule-based.yaml', 'w', encoding='utf-8') as f:
        yaml.dump(rules, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def get_main_chapter(position):
    return position.split('.')[0] if position else ''

def build_chapter_map(rules):
    chapter_map = defaultdict(list)
    for rule in rules:
        chapter = get_main_chapter(rule['position'])
        chapter_map[chapter].append(rule['id'])
    return chapter_map

def fix_horizontal_prompts(rules):
    chapter_map = build_chapter_map(rules)
    for rule in rules:
        current_chapter = get_main_chapter(rule['position'])
        # Get all other chapters
        other_chapters = [ch for ch in chapter_map if ch != current_chapter]
        random.shuffle(other_chapters)
        selected_ids = []
        used_chapters = set()
        for ch in other_chapters:
            # Pick a random rule from this chapter
            candidates = [rid for rid in chapter_map[ch] if rid != rule['id']]
            if candidates:
                selected_id = random.choice(candidates)
                selected_ids.append(selected_id)
                used_chapters.add(ch)
            if len(selected_ids) == 5:
                break
        # Assign the new horizontal_prompts (up to 5, all from unique chapters)
        rule['horizontal_prompts'] = selected_ids
        # Debug print
        print(f"Rule {rule['id']} ({rule['position']}) -> {[get_main_chapter(next(r for r in rules if r['id']==sid)['position']) for sid in selected_ids]}")

def main():
    rules = load_rules()
    fix_horizontal_prompts(rules)
    save_rules(rules)
    print("Done. All horizontal prompts are now from unique, different chapters.")

if __name__ == "__main__":
    main() 
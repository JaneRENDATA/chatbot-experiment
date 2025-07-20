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
        # Step 1: Pick as many as possible from unique chapters
        for ch in other_chapters:
            candidates = [rid for rid in chapter_map[ch] if rid != rule['id']]
            if candidates:
                selected_id = random.choice(candidates)
                selected_ids.append(selected_id)
                used_chapters.add(ch)
            if len(selected_ids) == 5:
                break
        # Step 2: If less than 5, fill from already used chapters (never current chapter)
        while len(selected_ids) < 5:
            fillable_chapters = list(used_chapters)
            if not fillable_chapters:
                break
            ch = random.choice(fillable_chapters)
            candidates = [rid for rid in chapter_map[ch] if rid != rule['id'] and rid not in selected_ids]
            # If all already used, allow repeats
            if not candidates:
                candidates = [rid for rid in chapter_map[ch] if rid != rule['id']]
            if candidates:
                selected_ids.append(random.choice(candidates))
            else:
                break
        rule['horizontal_prompts'] = selected_ids[:5]
        # Debug print
        print(f"Rule {rule['id']} ({rule['position']}) -> {[get_main_chapter(next(r for r in rules if r['id']==sid)['position']) for sid in selected_ids]}")

def main():
    rules = load_rules()
    fix_horizontal_prompts(rules)
    save_rules(rules)
    print("Done. All horizontal prompts are now 5, with at most one chapter repeated and never the current chapter.")

if __name__ == "__main__":
    main() 
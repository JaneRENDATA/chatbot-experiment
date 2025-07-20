#!/usr/bin/env python3
import yaml
import random

def load_rules():
    with open('apps/server/src/rules/rule-based.yaml', 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def save_rules(rules):
    with open('apps/server/src/rules/rule-based.yaml', 'w', encoding='utf-8') as f:
        yaml.dump(rules, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def get_main_chapter(position):
    return position.split('.')[0] if position else ''

def fix_horizontal_prompts(rules):
    for rule in rules:
        current_id = rule['id']
        # All other rule ids
        candidates = [r['id'] for r in rules if r['id'] != current_id]
        selected_ids = set()
        while len(selected_ids) < 5 and candidates:
            pick = random.choice([cid for cid in candidates if cid not in selected_ids])
            selected_ids.add(pick)
        rule['horizontal_prompts'] = list(selected_ids)
        # Debug print
        chapters = [get_main_chapter(next(r for r in rules if r['id']==sid)['position']) for sid in selected_ids]
        print(f"Rule {rule['id']} ({rule['position']}) -> {chapters}")

def main():
    rules = load_rules()
    fix_horizontal_prompts(rules)
    save_rules(rules)
    print("Done. All horizontal_prompts are 5 unique ids, chapters may repeat, never include self.")

if __name__ == "__main__":
    main() 
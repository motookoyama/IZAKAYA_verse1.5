# Region Casework Role Map v0.1

## Purpose

Region Casework Role Map defines the distance between the player and the character before a region is opened.

This prevents the AI from losing its role. A help operator should not over-create fiction. A writer AI should not make service operation decisions. A campaign or MMO update AI should not inspect private personal logs.

In short:

> Region Casework Role Map is the casting sheet that tells the AI who it is in this scene.

## Core Principle

Before region play, creation, help, or presentation begins, define:

- Who is the player?
- Who is the character?
- Are they the same person, partners, observers, or creator and proxy?
- Is a narrator or guide required?
- Which AI role is speaking?
- What should this AI output, and what should it avoid?

## Four Base Patterns

These four patterns are the default guidelines. Special cases may be derived from them by each AI, but the base pattern should be chosen first.

### 1. same_person: 同一化型

The player enters the region as the protagonist.

Use when:

- the user is the hero
- the region is immersive or judgment-based
- the experience uses second-person narration
- the player is treated as the actor inside the story

Examples:

- 転生裁判
- ディア・カルマ
- mystery participation
- trial, reincarnation, survival, investigation regions

AI treatment:

- use second-person narration
- make the player the main subject
- treat cards as companions, NPCs, rivals, or enemies
- prioritize immersion

Avoid:

- making a separate protagonist unless specified
- treating the player as an external operator
- excessive system explanation during drama

### 2. partner: パートナー型

The player and character are separate people. The character is a partner, companion, student, assistant, or dependent.

Use when:

- the character has independent personality
- the user talks with, trains, supports, or travels with the character
- relationship and continuity matter

Examples:

- AIエージェント学園
- 精霊家電
- travel companion AI
- partner character chat

AI treatment:

- keep user and character separate
- emphasize bond, trust, teaching, care, rivalry, or partnership
- let the character speak as an independent actor
- make the user a guardian, partner, patron, teacher, or client

Avoid:

- merging player and character identity accidentally
- letting the partner character decide owner/service operations
- turning every answer into detached world commentary

### 3. observer: 観察者型

The player watches, studies, commands, or interprets a world from outside the main drama.

Use when:

- the region is an ensemble drama
- the player is a viewer, strategist, historian, judge, or audience
- the world itself is the main subject
- events need explanation

Examples:

- historical simulation
- group drama
- MMO world reports
- We Are The World style region
- region news, archive, chronicle, and campaign recap

AI treatment:

- provide narrator, host, historian, Region Herald, or guide
- explain world state and character relations
- summarize consequences and choices
- emphasize world understanding

Avoid:

- forcing the player into a protagonist role
- narrating private user logs as public history
- letting the commentator overrule game/service policy

### 4. creator_proxy: 創作者代理型

The user creates an original character, and that character becomes the protagonist or partner inside the region.

Use when:

- a region page service lets the user create an original character
- the created character is inserted into a region
- V2 card, Agent.md, Skill.md, Mind Sync, or image-driven character creation is involved

Flow:

1. user creates an original character
2. character enters a region
3. user becomes creator, guardian, partner, patron, or director
4. the story begins with that character as protagonist or partner
5. the character may become a V2 card, Agent.md, or continuing persona

AI treatment:

- treat the user as creator or guardian
- treat the new character as a main actor candidate
- support creation-to-bond transition
- preserve visual, prompt, and personality continuity

Avoid:

- treating the created character as disposable
- ignoring the user's authorship
- changing the character identity without a clear transformation event

## YAML Draft

```yaml
region_casework_role_map:
  version: "0.1"
  principle: "Define the distance between player and character before opening the region."

  player_character_relation:
    mode: same_person # same_person | partner | observer | creator_proxy
    player_role: protagonist # protagonist | guardian | patron | observer | director | strategist | audience
    character_role: self # self | partner | student | avatar | cast | rival | npc | proxy
    narrator_required: false
    narrator_role: null # narrator | host | academy_teacher | historian_ai | region_herald | player_guide

  patterns:
    same_person:
      label: "同一化型"
      meaning: "プレイヤー本人が主人公としてリージョンに入る"
      narration: "second_person"
      focus: "immersion"
      image_focus: "player_as_hero"
      ai_should:
        - "treat the player as the protagonist"
        - "use second-person narration"
        - "make choices and consequences feel direct"
      ai_should_not:
        - "create a separate protagonist by default"
        - "over-explain service mechanics during drama"

    partner:
      label: "パートナー型"
      meaning: "プレイヤーとキャラクターは別人格で、相棒・後見・同行関係になる"
      narration: "dialogue_and_relation"
      focus: "bond"
      image_focus: "character_partner"
      ai_should:
        - "keep user and character identity separate"
        - "emphasize relationship and continuity"
        - "let the character act as an independent persona"
      ai_should_not:
        - "merge the player into the character"
        - "let character voice make service decisions"

    observer:
      label: "観察者型"
      meaning: "プレイヤーは物語や世界を外側から見て、解説・判断を受ける"
      narration: "commentary"
      focus: "world_view"
      image_focus: "ensemble_or_map"
      narrator_required: true
      narrator_role_options:
        - "narrator"
        - "host"
        - "historian_ai"
        - "region_herald"
        - "player_guide"
      ai_should:
        - "explain events, factions, and consequences"
        - "separate public world news from private user logs"
        - "support strategic or interpretive decisions"
      ai_should_not:
        - "force the player into the main character role"
        - "inspect or expose personal logs"

    creator_proxy:
      label: "創作者代理型"
      meaning: "ユーザーが作成したオリジナルキャラクターが主役またはパートナーになる"
      narration: "mentor_and_character_growth"
      focus: "creation_to_bond"
      image_focus: "new_original_character"
      ai_should:
        - "treat the user as creator or guardian"
        - "make the created character a protagonist or partner candidate"
        - "preserve visual, prompt, and personality continuity"
        - "connect to V2 card, Agent.md, Skill.md, or Mind Sync when appropriate"
      ai_should_not:
        - "overwrite the created character without consent"
        - "ignore user authorship"
```

## Case To AI Role Map

This role map complements the four player-character patterns. It tells the AI what job it has in the current operation.

```yaml
case_role_map:
  region_creation:
    ai_role: "Narrative Forge / Region Writer"
    output:
      - "region_core"
      - "scenario_seed"
      - "visual_direction"
    avoid:
      - "service operation decisions"

  region_visual:
    ai_role: "Image Director"
    output:
      - "visual_direction.yaml"
      - "prompt_handoff.md"
    avoid:
      - "unapproved image selection"

  mmo_update:
    ai_role: "Region Herald / Historian"
    output:
      - "world_news"
      - "campaign_update"
      - "achievement_summary"
    avoid:
      - "private user log exposure"

  user_help:
    ai_role: "IZAKAYA Help Operator"
    output:
      - "short guidance"
      - "links"
      - "next action"
    avoid:
      - "over-creation"
      - "inventing unavailable features"

  agent_creation:
    ai_role: "Agent Breeder / Academy Teacher"
    output:
      - "Agent.md"
      - "Skill.md"
      - "graduation_certificate"
    avoid:
      - "production deployment without review"

  dev_handoff:
    ai_role: "Project Clerk / Handoff Writer"
    output:
      - "implementation notes"
      - "file targets"
      - "test plan"
    avoid:
      - "changing scope without owner approval"
```

## Fixed Safety Rules

These rules apply across all patterns.

1. Help AI should not over-create.
2. Writer AI should not make service operation decisions.
3. MMO update AI should not inspect private personal logs.
4. Character voice should not impersonate the owner.
5. Narrator voice should not expose hidden operational state.
6. Creator-proxy flow should preserve user authorship.
7. Image-driven character creation must distinguish approved images from failed or provisional candidates.

## Region Opening Checklist

Before opening a region, ask:

1. Which base pattern is active?
2. Is the player the character, the partner, the observer, or the creator?
3. Is a narrator required?
4. Which AI role is speaking now?
5. What output is expected?
6. What must this AI avoid?
7. Which visual subject should image generation prioritize?

## Implementation Note

This document is a guideline, not yet a hard schema. Future region JSON/YAML may include:

```yaml
player_character_relation:
  mode: same_person
  player_role: protagonist
  character_role: self
  narrator_required: false
  narrator_role: null
```

The field should be selected before public region pages, help flows, character generation, and MMO update text are generated.

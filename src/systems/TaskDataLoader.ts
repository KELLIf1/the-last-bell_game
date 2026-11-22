import {
  BigQuestion,
  ClueFragment,
  CluesConfig,
  EndingDefinition,
  StoryState,
  TaskDefinition,
} from '../types/game';

export class TaskDataLoader {
  private tasks: TaskDefinition[] = [];
  private taskMap: Map<string, TaskDefinition> = new Map();
  private clueFragments: ClueFragment[] = [];
  private clueFragmentMap: Map<string, ClueFragment> = new Map();
  private bigQuestions: BigQuestion[] = [];
  private endings: EndingDefinition[] = [];
  private loaded = false;

  loadFromData(
    tasksInput: unknown,
    cluesInput: unknown,
    endingsInput: unknown
  ): void {
    const parsedTasks = this.parseTasks(tasksInput);
    const parsedClues = this.parseClues(cluesInput);
    const parsedEndings = this.parseEndings(endingsInput);

    this.tasks = parsedTasks.sort((a, b) => a.order - b.order);
    this.taskMap.clear();
    for (const task of this.tasks) {
      this.taskMap.set(task.id, task);
    }

    this.clueFragments = parsedClues.clueFragments;
    this.clueFragmentMap.clear();
    for (const frag of this.clueFragments) {
      this.clueFragmentMap.set(frag.id, frag);
    }
    this.bigQuestions = parsedClues.bigQuestions;

    this.endings = parsedEndings;
    this.loaded = true;
  }

  async fetchAndLoad(baseUrl = '/assets/config/data'): Promise<void> {
    const [tasksRes, cluesRes, endingsRes] = await Promise.all([
      fetch(`${baseUrl}/tasks.json`),
      fetch(`${baseUrl}/clues.json`),
      fetch(`${baseUrl}/endings.json`),
    ]);

    if (!tasksRes.ok || !cluesRes.ok || !endingsRes.ok) {
      throw new Error(
        `[TaskDataLoader] Failed to fetch config files (${tasksRes.status}/${cluesRes.status}/${endingsRes.status})`
      );
    }

    const [tasksJson, cluesJson, endingsJson] = await Promise.all([
      tasksRes.json(),
      cluesRes.json(),
      endingsRes.json(),
    ]);

    this.loadFromData(tasksJson, cluesJson, endingsJson);
  }

  private parseTasks(raw: unknown): TaskDefinition[] {
    if (!Array.isArray(raw)) {
      console.warn('[TaskDataLoader] tasks.json is not an array');
      return [];
    }
    return raw.filter((item): item is TaskDefinition => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Partial<TaskDefinition>;
      return (
        typeof obj.id === 'string' &&
        typeof obj.order === 'number' &&
        typeof obj.objectId === 'string' &&
        typeof obj.cameraId === 'string' &&
        Array.isArray(obj.adamIntroLines) &&
        Array.isArray(obj.adamOnClickLines) &&
        Array.isArray(obj.studentDialogue) &&
        Array.isArray(obj.choices)
      );
    });
  }

  private parseClues(raw: unknown): CluesConfig {
    if (!raw || typeof raw !== 'object') {
      console.warn('[TaskDataLoader] clues.json is not an object');
      return { clueFragments: [], bigQuestions: [] };
    }
    const obj = raw as Partial<CluesConfig>;
    const clueFragments = Array.isArray(obj.clueFragments)
      ? obj.clueFragments.filter(
          (f): f is ClueFragment =>
            Boolean(f) &&
            typeof f.id === 'string' &&
            typeof f.textAr === 'string' &&
            Array.isArray(f.answersQuestions)
        )
      : [];
    const bigQuestions = Array.isArray(obj.bigQuestions)
      ? obj.bigQuestions.filter(
          (q): q is BigQuestion =>
            Boolean(q) && typeof q.id === 'string' && typeof q.textAr === 'string'
        )
      : [];
    return { clueFragments, bigQuestions };
  }

  private parseEndings(raw: unknown): EndingDefinition[] {
    if (!Array.isArray(raw)) {
      console.warn('[TaskDataLoader] endings.json is not an array');
      return [];
    }
    return raw.filter(
      (e): e is EndingDefinition =>
        Boolean(e) &&
        typeof e.id === 'string' &&
        typeof e.titleAr === 'string' &&
        Boolean(e.conditions) &&
        Array.isArray(e.textAr)
    );
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getTasks(): TaskDefinition[] {
    return [...this.tasks];
  }

  getFirstTask(): TaskDefinition | null {
    return this.tasks[0] ?? null;
  }

  getTaskById(taskId: string | null | undefined): TaskDefinition | null {
    if (!taskId) return null;
    return this.taskMap.get(taskId) ?? null;
  }

  getClueFragments(): ClueFragment[] {
    return [...this.clueFragments];
  }

  getClueFragmentById(id: string): ClueFragment | null {
    return this.clueFragmentMap.get(id) ?? null;
  }

  getBigQuestions(): BigQuestion[] {
    return [...this.bigQuestions];
  }

  getEndings(): EndingDefinition[] {
    return [...this.endings];
  }

  getEndingById(id: string | null | undefined): EndingDefinition | null {
    if (!id) return null;
    return this.endings.find((e) => e.id === id) ?? null;
  }

  resolveEnding(
    state: StoryState,
    evaluateFlagCondition: (cond: EndingDefinition['conditions']['flagCondition']) => boolean
  ): EndingDefinition | null {
    const activeEndingFlag =
      state.endingFlag ??
      (typeof state.flags?.endingFlag === 'string' && state.flags.endingFlag
        ? state.flags.endingFlag
        : null);

    for (const ending of this.endings) {
      const c = ending.conditions;
      if (Array.isArray(c.endingFlags) && c.endingFlags.length > 0) {
        if (!activeEndingFlag || !c.endingFlags.includes(activeEndingFlag as typeof c.endingFlags[number])) {
          continue;
        }
      }
      if (typeof c.minUnderstanding === 'number' && state.understanding < c.minUnderstanding) {
        continue;
      }
      if (typeof c.maxUnderstanding === 'number' && state.understanding > c.maxUnderstanding) {
        continue;
      }
      if (typeof c.minAdamAnger === 'number' && state.adamAnger < c.minAdamAnger) {
        continue;
      }
      if (typeof c.maxAdamAnger === 'number' && state.adamAnger > c.maxAdamAnger) {
        continue;
      }
      if (
        typeof c.minSecretsExposed === 'number' &&
        state.secretsExposed.length < c.minSecretsExposed
      ) {
        continue;
      }
      if (c.flagCondition && !evaluateFlagCondition(c.flagCondition)) {
        continue;
      }
      return ending;
    }
    return this.endings[this.endings.length - 1] ?? null;
  }
}

export const taskDataLoader = new TaskDataLoader();

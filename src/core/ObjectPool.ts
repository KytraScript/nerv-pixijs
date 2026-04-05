import { NervBase } from './NervBase';

export class ObjectPool<T extends NervBase> {
  private _pool: T[] = [];
  private _active = new Set<T>();
  private _factory: () => T;
  private _reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this._factory = factory;
    this._reset = reset;
    this.prewarm(initialSize);
  }

  acquire(): T {
    let obj: T;
    if (this._pool.length > 0) {
      obj = this._pool.pop()!;
    } else {
      obj = this._factory();
    }
    obj.visible = true;
    this._active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this._active.has(obj)) return;
    this._active.delete(obj);
    this._reset(obj);
    obj.visible = false;
    obj.removeFromParent();
    this._pool.push(obj);
  }

  releaseAll(): void {
    for (const obj of this._active) {
      this._reset(obj);
      obj.visible = false;
      obj.removeFromParent();
      this._pool.push(obj);
    }
    this._active.clear();
  }

  get activeCount(): number { return this._active.size; }
  get poolSize(): number { return this._pool.length; }

  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const obj = this._factory();
      obj.visible = false;
      this._pool.push(obj);
    }
  }

  drain(): void {
    for (const obj of this._pool) obj.destroy({ children: true });
    this._pool.length = 0;
  }

  destroy(): void {
    for (const obj of this._active) obj.destroy({ children: true });
    this._active.clear();
    this.drain();
  }
}

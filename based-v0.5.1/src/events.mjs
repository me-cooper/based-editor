export class Events {
  #listeners=new Map();
  on(name,fn){if(typeof fn!=='function')throw new TypeError('Listener must be a function');if(!this.#listeners.has(name))this.#listeners.set(name,new Set());this.#listeners.get(name).add(fn);return ()=>{this.#listeners.get(name)?.delete(fn);};}
  emit(name,detail){const errors=[];for(const fn of [...this.#listeners.get(name)||[]]){try{fn(detail);}catch(error){errors.push(error);}}return errors;}
  clear(){this.#listeners.clear();}
}

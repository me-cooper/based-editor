import katex from 'katex';
import {Renderer, markdown} from './renderer.mjs';
import latex from '../plugins/latex.mjs';
import calendar from '../plugins/calendar.mjs';
import media from '../plugins/media.mjs';
import tasks from '../plugins/tasks.mjs';
export {Renderer, markdown, latex, calendar};
export const createRenderer = () => new Renderer([latex, calendar, media, tasks, markdown], {services:{katex}});

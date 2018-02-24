import { h, render } from 'preact';
import App from './app';
import 'todomvc-common';

render(<App />, document.querySelector('.todoapp'));

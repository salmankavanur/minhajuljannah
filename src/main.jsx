import { render } from "preact";
import { App } from "./app";
import { AdminPanel } from "./AdminPanel";
import { Router, Route } from "preact-router";

render(
  <Router>
    <Route path="/" component={App} />
    <Route path="/admin" component={AdminPanel} />
 
  </Router>,
  document.getElementById("app")
);
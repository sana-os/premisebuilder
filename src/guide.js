export function renderGuide(container, content) {
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const section = (title) => {
    const element = node("section", null, "guide-section");
    element.append(node("h3", title));
    container.append(element);
    return element;
  };
  const definitions = (parent, entries) => {
    const list = node("dl", null, "guide-definitions");
    for (const [term, description] of entries) {
      const group = node("div");
      group.append(node("dt", term), node("dd", description));
      list.append(group);
    }
    parent.append(list);
  };
  container.replaceChildren(node("p", content.intro, "guide-lead"), node("p", content.purpose));
  definitions(section(content.conceptsTitle), content.concepts);
  const steps = node("ol", null, "guide-steps");
  for (const [title, description] of content.steps) {
    const item = node("li");
    item.append(node("h4", title), node("p", description));
    steps.append(item);
  }
  section(content.stepsTitle).append(steps);
  const examples = section(content.examplesTitle);
  examples.append(node("p", content.examplesIntro));
  for (const [title, entries] of content.examples) {
    const detail = node("details", null, "guide-details");
    detail.append(node("summary", title));
    definitions(detail, entries);
    examples.append(detail);
  }
  definitions(section(content.statesTitle), content.states);
  definitions(section(content.filesTitle), content.files);
  const faq = section(content.faqTitle);
  for (const [title, description] of content.faq) {
    const detail = node("details", null, "guide-details");
    detail.append(node("summary", title), node("p", description));
    faq.append(detail);
  }
}

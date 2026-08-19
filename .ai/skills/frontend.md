# AI Skill: Frontend Development (React + TypeScript)

This guide defines coding standards for frontend modifications.

---

## 1. Design System & CSS Rules

* **Vanilla CSS Only**: Avoid installing Tailwind CSS or CSS-in-JS libraries unless explicitly authorized by the user. Use standard CSS modules or global stylesheet linkages.
* **Tokens Injection**: Access theme values using the defined CSS variables:
  ```css
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  font-size: var(--font-body);
  border-radius: 6px;
  ```
* **Hover Micro-Animations**: Implement subtle interactions to enhance tactile feel:
  ```css
  transition: background-color 150ms ease-in-out, border-color 150ms ease-in-out;
  ```

---

## 2. React & TypeScript Guidelines

* **Strict Typings**: Never use `any`. Define interfaces for API responses and component props in a dedicated `types/` subfolder.
* **Component Granularity**: Keep components small, focused, and reusable. Avoid building massive monolithic views.
* **State Hygiene**: Use standard React hooks (`useState`, `useMemo`, `useCallback`). Avoid loading state managers (e.g. Redux) unless scaling limits require it.
* **Routing**: Use `react-router-dom` for application navigation. Always maintain current URL states (e.g., query params for filters) so user states can be refreshed or bookmarked.

---

## 3. Accessibility & Structure

* **Semantic HTML**: Use proper tags (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`, `<button>`, `<a>`).
* **ARIA Attributes**: Ensure interactive elements have accessible descriptions. Use `aria-expanded` on accordion tabs and clear labels on search inputs.
* **Focus States**: Maintain visible focus rings for keyboard navigation.
* **Contrast Compliance**: Ensure text colors meet WCAG AA contrast ratios against surface backgrounds.

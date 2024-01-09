// index.js
import ReactDOM from 'react-dom/client';
import MyComponent from './MyComponent';


export const createReactApp = () => {
// Create a container element in your HTML where you want to render the component
  const rootElement = document.createElement('div');
  rootElement.setAttribute("id", "nfw");
  document.body.appendChild(rootElement);

  const root = ReactDOM.createRoot(rootElement);

// Render the component programmatically
  root.render(<MyComponent />);
}
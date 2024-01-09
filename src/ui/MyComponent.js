// MyComponent.js
import React, { useEffect } from 'react';

const MyComponent = () => {
  useEffect(() => {
    console.log('Mounted react app');
  }, [])
  return (
    <div>
      <h1>Hello from MyComponent!</h1>
      <p>This is a simple React component.</p>
    </div>
  );
};

export default MyComponent;

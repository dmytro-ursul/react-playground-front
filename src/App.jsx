import TodoList from 'components/todoList/TodoList';
import Login from 'components/Login';
import './App.css';

import {
  Routes,
  Route
} from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TodoList/>} />
      <Route path="/login" element={<Login/>} />
    </Routes>
  );
}
  
export default App;

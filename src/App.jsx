import TodoList from 'components/todoList/TodoList';
import Login from 'components/Login';
import ChangePassword from 'components/ChangePassword';
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
      <Route path="/change-password" element={<ChangePassword/>} />
    </Routes>
  );
}
  
export default App;

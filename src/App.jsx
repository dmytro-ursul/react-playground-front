import TodoList from 'components/todoList/TodoList';
import Login from 'components/Login';
import ChangePassword from 'components/ChangePassword';
import SecuritySettings from 'components/SecuritySettings';
import NetworkStatusIndicator from 'components/NetworkStatusIndicator';
import './styles/app.scss';

import {
  Routes,
  Route
} from "react-router-dom";

function App() {
  return (
    <>
      <NetworkStatusIndicator />
      <Routes>
        <Route path="/" element={<TodoList/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/change-password" element={<ChangePassword/>} />
        <Route path="/security" element={<SecuritySettings/>} />
      </Routes>
    </>
  );
}
  
export default App;

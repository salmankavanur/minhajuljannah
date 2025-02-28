import { useEffect, useState } from "preact/hooks";
import {
  AiOutlineUser,
  AiOutlineDashboard,
  AiOutlineLineChart,
  AiOutlineUserAdd,
  AiOutlineCalendar,
  AiOutlineLogout,
  AiOutlineSearch,
  AiOutlineDownload,
  AiOutlineFilter,
  AiOutlinePrinter,
  AiOutlineSetting,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineEye,
  AiOutlineMail
} from "react-icons/ai";
import "./admin-styles.scss";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterShared, setFilterShared] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: ""
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials({
      ...loginCredentials,
      [name]: value
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCredentials.username === "admin" && loginCredentials.password === "password") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginCredentials({ username: "", password: "" });
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('campaignUsers') || '[]');
    
    const filteredUsers = storedUsers.filter(user => {
      const matchesSearch = searchTerm === "" || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesShared = filterShared === null || user.shared === filterShared;
      return matchesSearch && matchesShared;
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      const valueA = typeof a[sortBy] === 'string' ? a[sortBy].toLowerCase() : a[sortBy];
      const valueB = typeof b[sortBy] === 'string' ? b[sortBy].toLowerCase() : b[sortBy];
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    setUsers(sortedUsers);
  }, [searchTerm, sortBy, sortOrder, filterShared]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h1>Campaign Admin</h1>
            <p>Sign in to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="admin-login-form">
            {loginError && <div className="login-error">{loginError}</div>}
            
            <div className="admin-input-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginCredentials.username}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <div className="admin-input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginCredentials.password}
                onChange={handleLoginChange}
                required
              />
            </div>
            
            <button type="submit" className="admin-login-button">
              Sign In
            </button>
          </form>
          
          <div className="admin-login-help">
            <p>Default credentials: admin / password</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <h2>Campaign Admin</h2>
          <button 
            className="mobile-close-menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <AiOutlineClose size="24" />
          </button>
        </div>
        
        <nav className="admin-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <a href="#dashboard" onClick={() => setActiveTab("dashboard")}>
                <AiOutlineDashboard size="20" />
                <span>Dashboard</span>
              </a>
            </li>
            <li className={activeTab === "users" ? "active" : ""}>
              <a href="#users" onClick={() => setActiveTab("users")}>
                <AiOutlineUser size="20" />
                <span>Users</span>
              </a>
            </li>
            <li className={activeTab === "analytics" ? "active" : ""}>
              <a href="#analytics" onClick={() => setActiveTab("analytics")}>
                <AiOutlineLineChart size="20" />
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <AiOutlineLogout size="20" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-mobile-header">
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <AiOutlineMenu size="24" />
          </button>
          <h2>Campaign Admin</h2>
        </div>
        
        {activeTab === "dashboard" && (
          <div className="admin-dashboard">
            <h1>Campaign Dashboard</h1>
            <p>Welcome to the admin dashboard!</p>
          </div>
        )}
        
        {activeTab === "users" && (
          <div className="admin-users">
            <h1>Campaign Users</h1>
            <div className="users-controls">
              <div className="search-box">
                <AiOutlineSearch size="20" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("id")}>ID</th>
                    <th onClick={() => handleSort("name")}>Name</th>
                    <th onClick={() => handleSort("email")}>Email</th>
                    <th onClick={() => handleSort("created")}>Date Created</th>
                    <th onClick={() => handleSort("location")}>Location</th>
                    <th onClick={() => handleSort("device")}>Device</th>
                    <th onClick={() => handleSort("shared")}>Shared</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.created)}</td>
                      <td>{user.location}</td>
                      <td>{user.device}</td>
                      <td>{user.shared ? "Yes" : "No"}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view-btn" title="View Details">
                            <AiOutlineEye size="16" />
                          </button>
                          <button className="action-btn email-btn" title="Send Email">
                            <AiOutlineMail size="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="page-numbers">
                {[...Array(totalPages).keys()].map(number => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={currentPage === number + 1 ? 'active' : ''}
                  >
                    {number + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div className="admin-analytics">
            <h1>Campaign Analytics</h1>
            <p>Analytics data will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
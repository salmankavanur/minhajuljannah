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
  AiOutlineMail,
  AiOutlineExport
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
  const [settings, setSettings] = useState({ campaignName: "Photo Frame Campaign" });

  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: ""
  });

  // Analytics calculation
  const getAnalyticsData = () => {
    const storedUsers = JSON.parse(localStorage.getItem('campaignUsers') || '[]');
    const totalUsers = storedUsers.length;
    const today = new Date().toISOString().split('T')[0];
    const activeToday = storedUsers.filter(user => 
      user.created.split('T')[0] === today
    ).length;
    const socialShares = storedUsers.filter(user => user.shared).length;

    const deviceBreakdown = storedUsers.reduce((acc, user) => {
      acc[user.device] = (acc[user.device] || 0) + 1;
      return acc;
    }, {});
    const totalDevices = Object.values(deviceBreakdown).reduce((a, b) => a + b, 0);
    const devicePercentages = {
      Mobile: Math.round((deviceBreakdown.Mobile || 0) / totalDevices * 100),
      Desktop: Math.round((deviceBreakdown.Desktop || 0) / totalDevices * 100),
      Tablet: Math.round((deviceBreakdown.Tablet || 0) / totalDevices * 100)
    };

    const userGrowth = [];
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    last7Days.forEach(date => {
      const count = storedUsers.filter(user => user.created.split('T')[0] === date).length;
      userGrowth.push({ date, count });
    });

    return {
      totalUsers,
      activeToday,
      postersCreated: totalUsers,
      socialShares,
      conversionRate: totalUsers > 0 ? Math.round((socialShares / totalUsers) * 100) : 0,
      deviceBreakdown: devicePercentages,
      userGrowth
    };
  };

  const [analyticsData, setAnalyticsData] = useState(getAnalyticsData());

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials({ ...loginCredentials, [name]: value });
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
    setTimeout(() => setNotification(null), 3000);
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
    setAnalyticsData(getAnalyticsData());
    setCurrentPage(1);
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

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Created", "Location", "Device", "Shared"];
    const csvData = users.map(user => [
      user.id,
      user.name,
      user.email,
      user.created,
      user.location,
      user.device,
      user.shared ? "Yes" : "No"
    ]);
    csvData.unshift(headers);
    const csvString = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "campaign_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Users exported successfully");
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('campaignSettings', JSON.stringify(settings));
    showNotification("Settings saved successfully");
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
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
            <li className={activeTab === "export" ? "active" : ""}>
              <a href="#export" onClick={() => setActiveTab("export")}>
                <AiOutlineExport size="20" />
                <span>Export Data</span>
              </a>
            </li>
            <li className={activeTab === "settings" ? "active" : ""}>
              <a href="#settings" onClick={() => setActiveTab("settings")}>
                <AiOutlineSetting size="20" />
                <span>Settings</span>
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
            <p className="last-updated">Last updated: {new Date().toLocaleString()}</p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users-icon"><AiOutlineUser size="24" /></div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p>{analyticsData.totalUsers}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon active-icon"><AiOutlineUserAdd size="24" /></div>
                <div className="stat-info">
                  <h3>Active Today</h3>
                  <p>{analyticsData.activeToday}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon posters-icon"><AiOutlineCalendar size="24" /></div>
                <div className="stat-info">
                  <h3>Posters Created</h3>
                  <p>{analyticsData.postersCreated}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon shares-icon"><AiOutlineLineChart size="24" /></div>
                <div className="stat-info">
                  <h3>Social Shares</h3>
                  <p>{analyticsData.socialShares}</p>
                </div>
              </div>
            </div>
            <div className="user-growth-section">
              <h2>User Growth (Last 7 Days)</h2>
              <div className="growth-chart">
                {analyticsData.userGrowth.map((day, index) => (
                  <div className="growth-point" key={index}>
                    <div className="growth-bar-container">
                      <div 
                        className="growth-bar" 
                        style={{ 
                          height: `${(day.count / Math.max(...analyticsData.userGrowth.map(d => d.count))) * 100}%`,
                          backgroundColor: `hsl(${210 + index * 5}, 80%, 55%)`
                        }}
                      ></div>
                    </div>
                    <div className="growth-label">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="growth-value">{day.count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="device-section">
                <h2>Device Breakdown</h2>
                <div className="device-legend">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#4361ee' }}></span>
                    <span>Mobile ({analyticsData.deviceBreakdown.Mobile}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#3a0ca3' }}></span>
                    <span>Desktop ({analyticsData.deviceBreakdown.Desktop}%)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#7209b7' }}></span>
                    <span>Tablet ({analyticsData.deviceBreakdown.Tablet}%)</span>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="filter-controls">
                <div className="filter-dropdown">
                  <button className="filter-button">
                    <AiOutlineFilter size="18" />
                    <span>Filter</span>
                  </button>
                  <div className="filter-dropdown-content">
                    <div className="filter-group">
                      <h4>Shared Status</h4>
                      <label>
                        <input 
                          type="radio" 
                          name="shared" 
                          checked={filterShared === null}
                          onChange={() => setFilterShared(null)}
                        />
                        <span>All</span>
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="shared" 
                          checked={filterShared === true}
                          onChange={() => setFilterShared(true)}
                        />
                        <span>Shared</span>
                      </label>
                      <label>
                        <input 
                          type="radio" 
                          name="shared" 
                          checked={filterShared === false}
                          onChange={() => setFilterShared(false)}
                        />
                        <span>Not Shared</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button onClick={exportToCSV} className="export-button">
                  <AiOutlineDownload size="18" />
                  <span>Export</span>
                </button>
                <button onClick={() => window.print()} className="print-button">
                  <AiOutlinePrinter size="18" />
                  <span>Print</span>
                </button>
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
                      <td>
                        <span className={`status-badge ${user.shared ? "shared" : "not-shared"}`}>
                          {user.shared ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view-btn" title="View Details" onClick={() => alert(`Viewing ${user.name}`)}>
                            <AiOutlineEye size="16" />
                          </button>
                          <button className="action-btn email-btn" title="Send Email" onClick={() => alert(`Emailing ${user.email}`)}>
                            <AiOutlineMail size="16" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="no-results">
                  <p>No users found matching your criteria.</p>
                </div>
              )}
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
            <div className="analytics-metrics">
              <div className="metric-card">
                <h3>Total Users</h3>
                <p className="metric-value">{analyticsData.totalUsers}</p>
              </div>
              <div className="metric-card">
                <h3>Posters Created</h3>
                <p className="metric-value">{analyticsData.postersCreated}</p>
              </div>
              <div className="metric-card">
                <h3>Social Shares</h3>
                <p className="metric-value">{analyticsData.socialShares}</p>
              </div>
              <div className="metric-card">
                <h3>Conversion Rate</h3>
                <p className="metric-value">{analyticsData.conversionRate}%</p>
              </div>
            </div>
            <div className="charts-container">
              <div className="chart-section">
                <h2>User Growth (Last 7 Days)</h2>
                <div className="growth-chart">
                  {analyticsData.userGrowth.map((day, index) => (
                    <div className="growth-point" key={index}>
                      <div className="growth-bar-container">
                        <div 
                          className="growth-bar" 
                          style={{ 
                            height: `${(day.count / Math.max(...analyticsData.userGrowth.map(d => d.count))) * 100}%`,
                            backgroundColor: `hsl(${210 + index * 5}, 80%, 55%)`
                          }}
                        ></div>
                      </div>
                      <div className="growth-label">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="growth-value">{day.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "export" && (
          <div className="admin-export">
            <h1>Export Data</h1>
            <div className="export-options">
              <button onClick={exportToCSV} className="export-btn">
                <AiOutlineDownload size="20" />
                <span>Export Users to CSV</span>
              </button>
              <button onClick={() => alert("JSON export coming soon")} className="export-btn">
                <AiOutlineDownload size="20" />
                <span>Export Users to JSON</span>
              </button>
            </div>
          </div>
        )}
        
        {activeTab === "settings" && (
          <div className="admin-settings">
            <h1>Settings</h1>
            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="settings-group">
                <label htmlFor="campaignName">Campaign Name</label>
                <input
                  type="text"
                  id="campaignName"
                  name="campaignName"
                  value={settings.campaignName}
                  onChange={handleSettingsChange}
                />
              </div>
              <button type="submit" className="save-settings-btn">
                Save Settings
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
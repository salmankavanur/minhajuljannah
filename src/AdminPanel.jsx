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
  AiOutlineExport,
  AiOutlineDelete,
  AiOutlineReload,
  AiOutlineCalendar as AiOutlineDate,
  AiOutlineLeft,
  AiOutlineRight,
} from "react-icons/ai";
import { IoSunny, IoMoon } from "react-icons/io5";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { format, subDays, parseISO } from "date-fns";
import axios from "axios";
import io from "socket.io-client";
import "./admin-styles.scss";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const socket = io("http://localhost:5000");

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
  const [theme, setTheme] = useState("light"); // Light/Dark mode
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // New state for sidebar

  const [loginCredentials, setLoginCredentials] = useState({ username: "", password: "" });

  // Fetch users from MongoDB
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      return response.data;
    } catch (err) {
      console.error("Error fetching users:", err);
      showNotification("Failed to load users", "error");
      return [];
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      showNotification("User deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      showNotification("Failed to delete user", "error");
    }
  };

  // Analytics calculation based on MongoDB data
  const getAnalyticsData = async (fetchedUsers) => {
    const storedUsers = fetchedUsers || (await fetchUsers());
    const filteredUsers = storedUsers.filter((user) => {
      const createdDate = new Date(user.created).toISOString().split("T")[0];
      return createdDate >= dateRange.startDate && createdDate <= dateRange.endDate;
    });

    const totalUsers = filteredUsers.length;
    const today = new Date().toISOString().split("T")[0];
    const activeToday = filteredUsers.filter(
      (user) => new Date(user.created).toISOString().split("T")[0] === today
    ).length;
    const socialShares = filteredUsers.filter((user) => user.shared).length;

    const deviceBreakdown = filteredUsers.reduce((acc, user) => {
      acc[user.device] = (acc[user.device] || 0) + 1;
      return acc;
    }, {});
    const totalDevices = Object.values(deviceBreakdown).reduce((a, b) => a + b, 0);
    const devicePercentages = {
      Mobile: Math.round((deviceBreakdown.Mobile || 0) / totalDevices * 100),
      Desktop: Math.round((deviceBreakdown.Desktop || 0) / totalDevices * 100),
      Tablet: Math.round((deviceBreakdown.Tablet || 0) / totalDevices * 100),
    };

    const userGrowth = [];
    const startDate = parseISO(dateRange.startDate);
    const endDate = parseISO(dateRange.endDate);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= daysDiff; i++) {
      const date = subDays(endDate, i);
      const dateStr = date.toISOString().split("T")[0];
      const count = storedUsers.filter(
        (user) => new Date(user.created).toISOString().split("T")[0] === dateStr
      ).length;
      userGrowth.push({ date: dateStr, count });
    }
    userGrowth.reverse();

    return {
      totalUsers,
      activeToday,
      postersCreated: totalUsers,
      socialShares,
      conversionRate: totalUsers > 0 ? Math.round((socialShares / totalUsers) * 100) : 0,
      deviceBreakdown: devicePercentages,
      deviceChartData: {
        labels: ["Mobile", "Desktop", "Tablet"],
        datasets: [
          {
            data: [
              deviceBreakdown.Mobile || 0,
              deviceBreakdown.Desktop || 0,
              deviceBreakdown.Tablet || 0,
            ],
            backgroundColor: ["#4361ee", "#7209b7", "#f72585"],
            borderWidth: 1,
          },
        ],
      },
      userGrowth,
      userGrowthChartData: {
        labels: userGrowth.map((d) => format(parseISO(d.date), "MMM dd")),
        datasets: [
          {
            label: "User Growth",
            data: userGrowth.map((d) => d.count),
            fill: false,
            borderColor: "#4361ee",
            tension: 0.1,
          },
        ],
      },
      recentActivity: storedUsers
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5)
        .map((user) => ({
          userId: user._id,
          message: `${user.name} created a poster`,
          timestamp: format(parseISO(user.created), "MMM dd, yyyy HH:mm"),
        })),
    };
  };

  const [analyticsData, setAnalyticsData] = useState({});

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      const allUsers = await fetchUsers();
      const filteredUsers = allUsers.filter((user) => {
        const matchesSearch =
          searchTerm === "" ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesShared = filterShared === null || user.shared === filterShared;
        const createdDate = new Date(user.created).toISOString().split("T")[0];
        const matchesDateRange =
          createdDate >= dateRange.startDate && createdDate <= dateRange.endDate;
        return matchesSearch && matchesShared && matchesDateRange;
      });

      const sortedUsers = [...filteredUsers].sort((a, b) => {
        const valueA = typeof a[sortBy] === "string" ? a[sortBy].toLowerCase() : a[sortBy];
        const valueB = typeof b[sortBy] === "string" ? b[sortBy].toLowerCase() : b[sortBy];
        if (sortOrder === "asc") return valueA > valueB ? 1 : -1;
        return valueA < valueB ? 1 : -1;
      });

      setUsers(sortedUsers);
      setAnalyticsData(await getAnalyticsData(allUsers));
      setCurrentPage(1);
    };
    loadData();

    // Real-time updates via Socket.IO
    socket.on("userAdded", (newUser) => {
      setUsers((prev) => {
        const updatedUsers = [...prev, newUser];
        // Recalculate analytics with the updated users array
        getAnalyticsData(updatedUsers).then(setAnalyticsData);
        return updatedUsers;
      });
    });

    socket.on("userUpdated", (updatedUser) => {
      setUsers((prev) => {
        const updatedUsers = prev.map((user) => (user._id === updatedUser._id ? updatedUser : user));
        getAnalyticsData(updatedUsers).then(setAnalyticsData);
        return updatedUsers;
      });
    });

    socket.on("userDeleted", (userId) => {
      setUsers((prev) => {
        const updatedUsers = prev.filter((user) => user._id !== userId);
        getAnalyticsData(updatedUsers).then(setAnalyticsData);
        return updatedUsers;
      });
    });

    return () => {
      socket.off("userAdded");
      socket.off("userUpdated");
      socket.off("userDeleted");
    };
  }, [searchTerm, sortBy, sortOrder, filterShared, dateRange]);

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
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || "admin";
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "password";

    if (
      loginCredentials.username === adminUsername &&
      loginCredentials.password === adminPassword
    ) {
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

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy HH:mm");
  };

  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Created", "Location", "Device", "Shared"];
    const csvData = users.map((user) => [
      user._id,
      user.name,
      user.email,
      formatDate(user.created),
      user.location,
      user.device,
      user.shared ? "Yes" : "No",
    ]);
    csvData.unshift(headers);
    const csvString = csvData.map((row) => row.join(",")).join("\n");
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

  const exportToJSON = () => {
    const jsonData = JSON.stringify(users, null, 2);
    const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "campaign_users.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Users exported to JSON successfully");
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showNotification("Settings saved successfully");
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
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
            <p>Default credentials: Contact your administrator</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container" data-theme={theme}>
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className={`admin-sidebar ${isMobileMenuOpen ? "mobile-open" : ""} ${isSidebarExpanded ? "expanded" : "collapsed"}`}>
  <div className="admin-sidebar-header">
    {isSidebarExpanded && <h2>Campaign Admin</h2>}
    <button
      className="sidebar-toggle-button"
      onClick={toggleSidebar}
      title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
    >
      {isSidebarExpanded ? <AiOutlineLeft size="20" /> : <AiOutlineRight size="20" />}
    </button>
    {/* Show the close button only in mobile view */}
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
        <a href="#dashboard" onClick={() => setActiveTab("dashboard")} title="Dashboard">
          <AiOutlineDashboard size="20" />
          {isSidebarExpanded && <span>Dashboard</span>}
        </a>
      </li>
      <li className={activeTab === "users" ? "active" : ""}>
        <a href="#users" onClick={() => setActiveTab("users")} title="Users">
          <AiOutlineUser size="20" />
          {isSidebarExpanded && <span>Users</span>}
        </a>
      </li>
      <li className={activeTab === "analytics" ? "active" : ""}>
        <a href="#analytics" onClick={() => setActiveTab("analytics")} title="Analytics">
          <AiOutlineLineChart size="20" />
          {isSidebarExpanded && <span>Analytics</span>}
        </a>
      </li>
      <li className={activeTab === "export" ? "active" : ""}>
        <a href="#export" onClick={() => setActiveTab("export")} title="Export Data">
          <AiOutlineExport size="20" />
          {isSidebarExpanded && <span>Export Data</span>}
        </a>
      </li>
      <li className={activeTab === "settings" ? "active" : ""}>
        <a href="#settings" onClick={() => setActiveTab("settings")} title="Settings">
          <AiOutlineSetting size="20" />
          {isSidebarExpanded && <span>Settings</span>}
        </a>
      </li>
    </ul>
  </nav>
  <div className="admin-sidebar-footer">
    <button onClick={handleLogout} className="logout-button" title="Log Out">
      <AiOutlineLogout size="20" />
      {isSidebarExpanded && <span>Log Out</span>}
    </button>
  </div>
</div>
      <div className={`admin-content ${isSidebarExpanded ? "sidebar-expanded" : "sidebar-collapsed"}`}>
        <div className="admin-header">
          <div className="admin-mobile-header">
            <button
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <AiOutlineMenu size="24" />
            </button>
            <h2>Campaign Admin</h2>
          </div>
          <div className="admin-header-actions">
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === "light" ? <IoMoon size="20" /> : <IoSunny size="20" />}
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="admin-dashboard">
            <div className="dashboard-header">
              <h1>Campaign Dashboard</h1>
              <button onClick={() => window.location.reload()} className="refresh-button">
                <AiOutlineReload size="20" />
                <span>Refresh</span>
              </button>
            </div>
            <p className="last-updated">
              Last updated: {new Date().toLocaleString()}
            </p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users-icon">
                  <AiOutlineUser size="24" />
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p>{analyticsData.totalUsers || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon active-icon">
                  <AiOutlineUserAdd size="24" />
                </div>
                <div className="stat-info">
                  <h3>Active Today</h3>
                  <p>{analyticsData.activeToday || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon posters-icon">
                  <AiOutlineCalendar size="24" />
                </div>
                <div className="stat-info">
                  <h3>Posters Created</h3>
                  <p>{analyticsData.postersCreated || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon shares-icon">
                  <AiOutlineLineChart size="24" />
                </div>
                <div className="stat-info">
                  <h3>Social Shares</h3>
                  <p>{analyticsData.socialShares || 0}</p>
                </div>
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="chart-section">
                <h2>User Growth Trend</h2>
                <div className="chart-wrapper">
                  <Line
                    data={analyticsData.userGrowthChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Number of Users" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="chart-section">
                <h2>Top Devices</h2>
                <div className="chart-wrapper pie-chart-wrapper">
                  <Pie
                    data={analyticsData.deviceChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "bottom" },
                        title: { display: false },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="recent-activity-section">
              <h2>Recent Activity</h2>
              <div className="activity-feed">
                {(analyticsData.recentActivity || []).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <AiOutlineUser size="20" />
                    </div>
                    <div className="activity-details">
                      <p>{activity.message}</p>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
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
                    <div className="filter-group">
                      <h4>Date Range</h4>
                      <label>
                        <span>Start Date:</span>
                        <input
                          type="date"
                          name="startDate"
                          value={dateRange.startDate}
                          onChange={handleDateRangeChange}
                        />
                      </label>
                      <label>
                        <span>End Date:</span>
                        <input
                          type="date"
                          name="endDate"
                          value={dateRange.endDate}
                          onChange={handleDateRangeChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <button onClick={exportToCSV} className="export-button">
                  <AiOutlineDownload size="18" />
                  <span>Export CSV</span>
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
                    <th onClick={() => handleSort("_id")}>ID</th>
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
                  {currentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user._id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{formatDate(user.created)}</td>
                      <td>{user.location}</td>
                      <td>{user.device}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            user.shared ? "shared" : "not-shared"
                          }`}
                        >
                          {user.shared ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn view-btn"
                            title="View Poster"
                            onClick={() => window.open(user.posterUrl, "_blank")}
                          >
                            <AiOutlineEye size="16" />
                          </button>
                          <button
                            className="action-btn email-btn"
                            title="Send Email"
                            onClick={() => alert(`Emailing ${user.email}`)}
                          >
                            <AiOutlineMail size="16" />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            title="Delete User"
                            onClick={() => deleteUser(user._id)}
                          >
                            <AiOutlineDelete size="16" />
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
                {[...Array(totalPages).keys()].map((number) => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={currentPage === number + 1 ? "active" : ""}
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
                <p className="metric-value">{analyticsData.totalUsers || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Posters Created</h3>
                <p className="metric-value">{analyticsData.postersCreated || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Social Shares</h3>
                <p className="metric-value">{analyticsData.socialShares || 0}</p>
              </div>
              <div className="metric-card">
                <h3>Conversion Rate</h3>
                <p className="metric-value">{analyticsData.conversionRate || 0}%</p>
              </div>
            </div>
            <div className="charts-container">
              <div className="chart-section">
                <h2>User Growth Trend</h2>
                <div className="chart-wrapper">
                  <Line
                    data={analyticsData.userGrowthChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: "Number of Users" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              <div className="chart-section">
                <h2>Device Distribution</h2>
                <div className="chart-wrapper pie-chart-wrapper">
                  <Pie
                    data={analyticsData.deviceChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "bottom" },
                        title: { display: false },
                      },
                    }}
                  />
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
              <button onClick={exportToJSON} className="export-btn">
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
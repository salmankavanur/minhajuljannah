// src/AdminPanel.jsx
import { useEffect, useState } from "preact/hooks";
import {
  AiOutlineUser,
  AiOutlineDashboard,
  // ... (keep all other imports)
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

  // Fetch real analytics data
  const getAnalyticsData = () => {
    const storedUsers = JSON.parse(localStorage.getItem('campaignUsers') || '[]');
    const totalUsers = storedUsers.length;
    const today = new Date().toISOString().split('T')[0];
    const activeToday = storedUsers.filter(user => 
      user.created.split('T')[0] === today
    ).length;
    const socialShares = storedUsers.filter(user => user.shared).length;

    // Calculate device breakdown
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

    // Get top locations
    const locations = storedUsers.reduce((acc, user) => {
      acc[user.location] = (acc[user.location] || 0) + 1;
      return acc;
    }, {});
    const topLocations = Object.entries(locations)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ... (implement other analytics calculations as needed)

    return {
      totalUsers,
      activeToday,
      postersCreated: totalUsers,
      socialShares,
      conversionRate: totalUsers > 0 ? Math.round((socialShares / totalUsers) * 100) : 0,
      deviceBreakdown: devicePercentages,
      topLocations
    };
  };

  const [analyticsData, setAnalyticsData] = useState(getAnalyticsData());

  // ... (keep all the existing functions like handleLogin, handleSort, exportToCSV, etc.)

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
  }, [searchTerm, sortBy, sortOrder, filterShared]);

  // ... (rest of the component remains the same as your original code)
  // Just replace MOCK_USERS with users and ANALYTICS_DATA with analyticsData
}
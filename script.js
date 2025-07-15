document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userNameInput = document.getElementById('userNameInput');
    const userEmail = document.getElementById('userEmail');
    const accessKey = document.getElementById('accessKey');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const verifyBtn = document.getElementById('verifyBtn');
    const messageDiv = document.getElementById('message');
    const calculatorSection = document.getElementById('calculatorSection');
    const adminSection = document.getElementById('adminSection');
    const themeToggle = document.getElementById('themeToggle');
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuContent = document.getElementById('menuContent');
    const closeMenu = document.getElementById('closeMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileImage = document.getElementById('profileImage');
    const editProfileImage = document.getElementById('editProfileImage');
    const userNameDisplay = document.getElementById('userName');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const logoutBtn = document.getElementById('logoutBtn');
    const capitalInput = document.getElementById('capital');
    const marginInput = document.getElementById('margin');
    const stopLossInput = document.getElementById('stopLoss');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultCard = document.getElementById('resultCard');
    const leverageResult = document.getElementById('leverageResult');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const offlineMessage = document.querySelector('.offline-message');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const imageModal = document.getElementById('imageModal');
    const closeImageModal = document.getElementById('closeImageModal');
    const imageUpload = document.getElementById('imageUpload');
    const adminTableBody = document.getElementById('adminTableBody');
    const adminSearch = document.getElementById('adminSearch');
    const downloadBtn = document.getElementById('downloadBtn');
    const confirmNameChange = document.getElementById('confirmNameChange');
    const currentName = document.getElementById('currentName');
    const newName = document.getElementById('newName');
    const changeNameKey = document.getElementById('changeNameKey');
    const currentEmail = document.getElementById('currentEmail');
    const newEmail = document.getElementById('newEmail');
    const changeEmailKey = document.getElementById('changeEmailKey');
    const confirmEmailChange = document.getElementById('confirmEmailChange');
    const contactBtn = document.getElementById('contactBtn');
    const contactModal = document.getElementById('contactModal');
    const closeContactModal = document.getElementById('closeContactModal');
    const mainHeader = document.getElementById('mainHeader');
    const mainFooter = document.getElementById('mainFooter');

    // State
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let isAdmin = false;
    let users = [];
    let currentUser = null;
    let ws = null;
    const deviceId = generateDeviceId();
    const BACKEND_URL = 'http://localhost:3001'; // Change to your backend URL

    // Initialize
    initTheme();
    checkNetworkStatus();
    loadSampleData();
    checkSession();
    connectWebSocket();

    // Event Listeners
    userNameInput.addEventListener('input', handleNameInput);
    userEmail.addEventListener('input', handleEmailInput);
    accessKey.addEventListener('input', handleAccessKeyInput);
    verifyBtn.addEventListener('click', verifyAccess);
    termsCheckbox.addEventListener('change', handleTermsChange);
    themeToggle.addEventListener('click', toggleTheme);
    menuToggle.addEventListener('click', openMenu);
    menuOverlay.addEventListener('click', closeMenuHandler);
    closeMenu.addEventListener('click', closeMenuHandler);
    closeMenuBtn.addEventListener('click', closeMenuHandler);
    settingsBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsHandler);
    logoutBtn.addEventListener('click', logout);
    capitalInput.addEventListener('input', handleCapitalInput);
    marginInput.addEventListener('input', handleMarginInput);
    stopLossInput.addEventListener('input', handleStopLossInput);
    calculateBtn.addEventListener('click', calculateLeverage);
    adminLogoutBtn.addEventListener('click', adminLogout);
    editProfileImage.addEventListener('click', openImageUpload);
    closeImageModal.addEventListener('click', closeImageUpload);
    imageUpload.addEventListener('change', handleImageUpload);
    adminSearch.addEventListener('input', filterAdminTable);
    downloadBtn.addEventListener('click', downloadData);
    confirmNameChange.addEventListener('click', changeName);
    confirmEmailChange.addEventListener('click', changeEmail);
    contactBtn.addEventListener('click', openContactModal);
    closeContactModal.addEventListener('click', closeContactModalHandler);
    
    window.addEventListener('online', () => {
        offlineMessage.style.display = 'none';
    });
    
    window.addEventListener('offline', () => {
        offlineMessage.style.display = 'block';
    });

    // WebSocket Functions
    function connectWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        ws = new WebSocket(`${wsProtocol}${BACKEND_URL.replace(/^https?:\/\//, '')}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            if (currentUser) {
                registerDevice();
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'forceLogout') {
                showMessage('You have been logged out from another device', 'error');
                setTimeout(logout, 2000);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    function registerDevice() {
        if (ws && ws.readyState === WebSocket.OPEN && currentUser) {
            ws.send(JSON.stringify({
                type: 'register',
                deviceId: deviceId,
                accessKey: currentUser.key,
                isMainDevice: currentUser.isMainDevice
            }));
        }
    }

    // Core Functions
    async function verifyAccess() {
        const key = accessKey.value.trim();
        const name = userNameInput.value.trim();
        const email = userEmail.value.trim();
        
        clearMessages();
        
        if (!name || !email || !key) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!termsCheckbox.checked) {
            showMessage('You must accept the Terms and Conditions', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    accessKey: key, 
                    deviceId 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showMessage(data.error || 'Verification failed', 'error');
                return;
            }
            
            if (data.isAdmin) {
                handleAdminAccess();
                return;
            }
            
            handleUserAccess(key, name, email, data);
            
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        }
    }

    function handleAdminAccess() {
        isAdmin = true;
        adminSection.style.display = 'block';
        document.querySelector('.verification-section').style.display = 'none';
        mainHeader.style.display = 'none';
        mainFooter.style.display = 'none';
        showMessage('Admin access granted', 'success');
        setTimeout(clearMessages, 3000);
        localStorage.setItem('adminSession', 'active');
        updateAdminDashboard();
    }

    function handleUserAccess(key, name, email, data) {
        let user = users.find(u => u.key === key);
        
        if (!user) {
            user = createNewUser(key, name, email, data.packageType);
            users.push(user);
        } else {
            updateExistingUser(user, name, email);
        }
        
        currentUser = user;
        currentUser.isMainDevice = data.isMainDevice;
        localStorage.setItem('currentUserKey', key);
        saveUsers();
        
        calculatorSection.style.display = 'block';
        document.querySelector('.verification-section').style.display = 'none';
        mainHeader.style.display = 'flex';
        mainFooter.style.display = 'block';
        
        updateUserUI(name, email);
        registerDevice();
        showMessage('Access Granted!', 'success');
        setTimeout(clearMessages, 3000);
    }

    function createNewUser(key, name, email, packageType) {
        const now = new Date();
        const user = {
            key,
            package: packageType,
            status: 'active',
            device_id: deviceId,
            usage_count: 1,
            activated_time: now.toISOString(),
            name,
            email,
            note: 'Auto-created on first use',
            isMainDevice: true
        };
        
        if (packageType !== 'lifetime') {
            const expirationDate = new Date(now);
            expirationDate.setDate(expirationDate.getDate() + 
                (packageType === 'monthly' ? 30 : 90));
            user.expired_time = expirationDate.toISOString();
        }
        
        return user;
    }

    function updateExistingUser(user, name, email) {
        user.status = 'active';
        user.device_id = deviceId;
        user.usage_count = (user.usage_count || 0) + 1;
        user.activated_time = user.activated_time || new Date().toISOString();
        user.name = name;
        user.email = email;
    }

    async function logout() {
        try {
            if (currentUser) {
                await fetch(`${BACKEND_URL}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        accessKey: currentUser.key, 
                        deviceId 
                    })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        currentUser = null;
        localStorage.removeItem('currentUserKey');
        localStorage.removeItem('adminSession');
        
        calculatorSection.style.display = 'none';
        adminSection.style.display = 'none';
        document.querySelector('.verification-section').style.display = 'block';
        mainHeader.style.display = 'none';
        mainFooter.style.display = 'none';
        userNameDisplay.textContent = '';
        
        clearMessages();
        resetForm();
        closeMenuHandler();
    }

    function adminLogout() {
        isAdmin = false;
        localStorage.removeItem('adminSession');
        adminSection.style.display = 'none';
        document.querySelector('.verification-section').style.display = 'block';
        mainHeader.style.display = 'none';
        mainFooter.style.display = 'none';
        
        // Clear messages
        clearMessages();
    }
    
    function handleCapitalInput() {
        if (capitalInput.value > 0) {
            marginInput.disabled = false;
        } else {
            marginInput.disabled = true;
            marginInput.value = '';
            stopLossInput.disabled = true;
            stopLossInput.value = '';
            calculateBtn.disabled = true;
            resultCard.style.display = 'none';
        }
    }
    
    function handleMarginInput() {
        const capital = parseFloat(capitalInput.value);
        const margin = parseFloat(marginInput.value);
        
        if (margin > capital) {
            marginInput.value = capital;
        }
        
        if (margin > 0) {
            stopLossInput.disabled = false;
        } else {
            stopLossInput.disabled = true;
            stopLossInput.value = '';
            calculateBtn.disabled = true;
            resultCard.style.display = 'none';
        }
    }
    
    function handleStopLossInput() {
        const stopLoss = parseFloat(stopLossInput.value);
        
        if (stopLoss > 100) {
            stopLossInput.value = 100;
        }
        
        calculateBtn.disabled = !(stopLoss > 0);
    }
    
    function calculateLeverage() {
    // Get input values
    let capital = parseFloat(capitalInput.value);
    let margin = parseFloat(marginInput.value);
    let stopLoss = parseFloat(stopLossInput.value);

    // Hide result card by default
    resultCard.style.display = 'none';

    // Validate capital
    if (isNaN(capital) || capital <= 0) {
        marginInput.disabled = true;
        marginInput.value = '';
        stopLossInput.disabled = true;
        stopLossInput.value = '';
        calculateBtn.disabled = true;
        return;
    }

    // Validate margin
    if (isNaN(margin) || margin <= 0) {
        stopLossInput.disabled = true;
        stopLossInput.value = '';
        calculateBtn.disabled = true;
        return;
    }

    // Validate stop loss
    if (isNaN(stopLoss) || stopLoss <= 0) {
        calculateBtn.disabled = true;
        return;
    }

    // Enforce your rules
    if (margin > capital) {
        margin = capital;
        marginInput.value = capital;
    }

    if (stopLoss > 100) {
        stopLoss = 100;
        stopLossInput.value = 100;
    }

    // Your leverage formula
    const leverage = (margin * 100) / (margin * stopLoss);

    // Show result
    leverageResult.textContent = Math.round(leverage);
    resultCard.style.display = 'block';
}

// Input event handlers with your rules
capitalInput.addEventListener('input', function() {
    if (this.value && parseFloat(this.value) > 0) {
        marginInput.disabled = false;
    } else {
        marginInput.disabled = true;
        marginInput.value = '';
        stopLossInput.disabled = true;
        stopLossInput.value = '';
        calculateBtn.disabled = true;
        resultCard.style.display = 'none';
    }
});

marginInput.addEventListener('input', function() {
    if (this.value && parseFloat(this.value) > 0) {
        stopLossInput.disabled = false;
    } else {
        stopLossInput.disabled = true;
        stopLossInput.value = '';
        calculateBtn.disabled = true;
        resultCard.style.display = 'none';
    }
});

stopLossInput.addEventListener('input', function() {
    if (this.value && parseFloat(this.value) > 0) {
        calculateBtn.disabled = false;
    } else {
        calculateBtn.disabled = true;
        resultCard.style.display = 'none';
    }
});

// Clear result if any input changes
capitalInput.addEventListener('change', () => resultCard.style.display = 'none');
marginInput.addEventListener('change', () => resultCard.style.display = 'none');
stopLossInput.addEventListener('change', () => resultCard.style.display = 'none');
    
    function checkNetworkStatus() {
        if (!navigator.onLine) {
            offlineMessage.style.display = 'block';
        }
    }
    
    function openImageUpload() {
        imageModal.style.display = 'flex';
        closeMenuHandler();
    }
    
    function closeImageUpload() {
        imageModal.style.display = 'none';
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            profileImage.innerHTML = '';
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            profileImage.appendChild(img);
            
            // Add edit icon back
            const editIcon = document.createElement('div');
            editIcon.className = 'edit-icon';
            editIcon.innerHTML = '<i class="fas fa-pen"></i>';
            editIcon.addEventListener('click', openImageUpload);
            profileImage.appendChild(editIcon);
            
            // Save to localStorage
            localStorage.setItem('profileImage', event.target.result);
        };
        reader.readAsDataURL(file);
        
        closeImageUpload();
    }
    
    function loadSampleData() {
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
            users = JSON.parse(savedUsers);
        } else {
            users = [];
            saveUsers();
        }
        
        // Load profile image if exists
        const savedImage = localStorage.getItem('profileImage');
        if (savedImage) {
            profileImage.innerHTML = '';
            const img = document.createElement('img');
            img.src = savedImage;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            profileImage.appendChild(img);
            
            // Add edit icon
            const editIcon = document.createElement('div');
            editIcon.className = 'edit-icon';
            editIcon.innerHTML = '<i class="fas fa-pen"></i>';
            editIcon.addEventListener('click', openImageUpload);
            profileImage.appendChild(editIcon);
        }
    }
    
    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    function updateAdminDashboard() {
        // Update stats
        document.getElementById('allKeys').textContent = users.length;
        document.getElementById('monthlyKeys').textContent = users.filter(u => u.package === 'monthly').length;
        document.getElementById('threeMonthKeys').textContent = users.filter(u => u.package === '3months').length;
        document.getElementById('lifetimeKeys').textContent = users.filter(u => u.package === 'lifetime').length;
        document.getElementById('activeKeys').textContent = users.filter(u => u.status === 'active').length;
        document.getElementById('blockedKeys').textContent = users.filter(u => u.status === 'blocked').length;
        document.getElementById('expiredKeys').textContent = users.filter(u => {
            return u.expired_time && new Date(u.expired_time) < new Date() && u.status !== 'blocked';
        }).length;
        
        // Update table
        adminTableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            
            // Status class
            let statusClass = '';
            if (user.status === 'active') statusClass = 'status-active';
            else if (user.status === 'blocked') statusClass = 'status-blocked';
            else if (user.expired_time && new Date(user.expired_time) < new Date()) statusClass = 'status-expired';
            else statusClass = 'status-inactive';
            
            // Expired time display
            let expiredDisplay = '-';
            if (user.expired_time) {
                expiredDisplay = new Date(user.expired_time).toLocaleDateString();
            }
            
            // Activated time display
            let activatedDisplay = '-';
            if (user.activated_time) {
                activatedDisplay = new Date(user.activated_time).toLocaleDateString();
            }
            
            row.innerHTML = `
                <td>${user.key}</td>
                <td>${user.package}</td>
                <td class="${statusClass}">${user.status || 'inactive'}</td>
                <td>${user.device_id || '-'}</td>
                <td>${user.usage_count || 0}</td>
                <td>${activatedDisplay}</td>
                <td>${expiredDisplay}</td>
                <td><input type="text" class="edit-field" data-field="name" data-key="${user.key}" value="${user.name || ''}"></td>
                <td><input type="text" class="edit-field" data-field="email" data-key="${user.key}" value="${user.email || ''}"></td>
                <td><input type="text" class="edit-field" data-field="note" data-key="${user.key}" value="${user.note || ''}"></td>
                <td>
                    <button class="btn-action btn-small" data-action="toggle" data-key="${user.key}">
                        ${user.status === 'blocked' ? 'Activate' : 'Block'}
                    </button>
                    <button class="btn-action btn-small" data-action="delete" data-key="${user.key}">Delete</button>
                </td>
            `;
            
            adminTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const key = this.getAttribute('data-key');
                
                if (action === 'toggle') {
                    toggleUserStatus(key);
                } else if (action === 'delete') {
                    deleteUser(key);
                }
            });
        });
        
        // Add event listeners to edit fields
        document.querySelectorAll('.edit-field').forEach(field => {
            field.addEventListener('change', function() {
                const fieldName = this.getAttribute('data-field');
                const key = this.getAttribute('data-key');
                const value = this.value;
                
                updateUserField(key, fieldName, value);
            });
        });
    }
    
    function updateUserField(key, field, value) {
        const user = users.find(u => u.key === key);
        if (!user) return;
        
        user[field] = value;
        saveUsers();
        
        // If editing current user, update UI
        if (currentUser && currentUser.key === key && (field === 'name' || field === 'email')) {
            if (field === 'name') {
                profileName.textContent = value;
                userNameDisplay.textContent = value;
            } else if (field === 'email') {
                profileEmail.textContent = value;
            }
        }
    }
    
    function toggleUserStatus(key) {
        const user = users.find(u => u.key === key);
        if (!user) return;
        
        if (user.status === 'blocked') {
            user.status = 'active';
        } else {
            user.status = 'blocked';
        }
        
        saveUsers();
        updateAdminDashboard();
    }
    
    function deleteUser(key) {
        if (confirm('Are you sure you want to delete this key?')) {
            users = users.filter(u => u.key !== key);
            saveUsers();
            updateAdminDashboard();
        }
    }
    
    function filterAdminTable() {
        const searchTerm = adminSearch.value.toLowerCase();
        const rows = adminTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
    
    function downloadData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "users_data.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    }
    
    function changeName() {
        const currentNameValue = currentName.value.trim();
        const newNameValue = newName.value.trim();
        const key = changeNameKey.value.trim();
        
        if (!currentNameValue || !newNameValue || !key) {
            alert('All fields are required');
            return;
        }
        
        if (currentNameValue === newNameValue) {
            alert('New name must be different from current name');
            return;
        }
        
        const user = users.find(u => u.key === key && u.name === currentNameValue);
        if (!user) {
            alert('Invalid credentials');
            return;
        }
        
        user.name = newNameValue;
        saveUsers();
        
        // Update UI
        profileName.textContent = newNameValue;
        userNameDisplay.textContent = newNameValue;
        
        if (isAdmin) {
            updateAdminDashboard();
        }
        
        alert('Name changed successfully');
        closeSettingsHandler();
    }
    
    function changeEmail() {
        const currentEmailValue = currentEmail.value.trim();
        const newEmailValue = newEmail.value.trim();
        const key = changeEmailKey.value.trim();
        
        if (!currentEmailValue || !newEmailValue || !key) {
            alert('All fields are required');
            return;
        }
        
        if (currentEmailValue === newEmailValue) {
            alert('New email must be different from current email');
            return;
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmailValue)) {
            alert('Please enter a valid email address');
            return;
        }
        
        const user = users.find(u => u.key === key && u.email === currentEmailValue);
        if (!user) {
            alert('Invalid credentials');
            return;
        }
        
        user.email = newEmailValue;
        saveUsers();
        
        // Update UI
        profileEmail.textContent = newEmailValue;
        
        if (isAdmin) {
            updateAdminDashboard();
        }
        
        alert('Email changed successfully');
        closeSettingsHandler();
    }
    
    function checkSession() {
        clearMessages();
        
        // Check for admin session
        if (localStorage.getItem('adminSession') === 'active') {
            isAdmin = true;
            adminSection.style.display = 'block';
            document.querySelector('.verification-section').style.display = 'none';
            mainHeader.style.display = 'none';
            mainFooter.style.display = 'none';
            updateAdminDashboard();
            return;
        }
        
        // Check for user session
        const userKey = localStorage.getItem('currentUserKey');
        if (userKey) {
            const user = users.find(u => u.key === userKey);
            if (user) {
                currentUser = user;
                
                // Show calculator and hide verification
                calculatorSection.style.display = 'block';
                document.querySelector('.verification-section').style.display = 'none';
                mainHeader.style.display = 'flex';
                mainFooter.style.display = 'block';
                
                // Update UI
                userNameDisplay.textContent = user.name;
                profileName.textContent = user.name;
                profileEmail.textContent = user.email;
                
                // Load profile image if exists
                const savedImage = localStorage.getItem('profileImage');
                if (savedImage) {
                    profileImage.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = savedImage;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.borderRadius = '50%';
                    img.style.objectFit = 'cover';
                    profileImage.appendChild(img);
                    
                    // Add edit icon
                    const editIcon = document.createElement('div');
                    editIcon.className = 'edit-icon';
                    editIcon.innerHTML = '<i class="fas fa-pen"></i>';
                    editIcon.addEventListener('click', openImageUpload);
                    profileImage.appendChild(editIcon);
                }
            }
        }
    }
});

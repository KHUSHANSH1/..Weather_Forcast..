// Create and show splash screen
function createSplashScreen() {
  const splashScreen = document.createElement('div');
  splashScreen.className = 'splash-screen';
  
  // Create logo element (using Font Awesome icon as a placeholder)
  const logoContainer = document.createElement('div');
  logoContainer.className = 'splash-logo';
  logoContainer.innerHTML = '<i class="fas fa-cloud-sun" style="font-size: 80px; color: white;"></i>';
  
  // Create app name text
  const appName = document.createElement('div');
  appName.className = 'splash-text';
  appName.textContent = 'WeatherVerse';
  
  // Add elements to splash screen
  splashScreen.appendChild(logoContainer);
  splashScreen.appendChild(appName);
  
  // Add splash screen to body
  document.body.appendChild(splashScreen);
  
  // Hide splash screen after 2 seconds
  setTimeout(() => {
    splashScreen.classList.add('hidden');
    setTimeout(() => {
      splashScreen.remove();
    }, 500);
  }, 2000);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Show splash screen
    createSplashScreen();
    
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// PWA Installation
let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';
installButton.classList.add('install-button');
installButton.textContent = 'Install App';

// Add the install button to the DOM
document.querySelector('.container').appendChild(installButton);

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  installButton.style.display = 'block';
  
  // Position the install button in a fixed position at the bottom of the screen
  installButton.style.position = 'fixed';
  installButton.style.bottom = '20px';
  installButton.style.right = '20px';
  installButton.style.zIndex = '1000';
  installButton.style.backgroundColor = 'var(--primary-color)';
  installButton.style.color = 'white';
  installButton.style.border = 'none';
  installButton.style.borderRadius = '50px';
  installButton.style.padding = '10px 20px';
  installButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  installButton.style.cursor = 'pointer';
  installButton.style.fontFamily = 'Poppins, sans-serif';
  installButton.style.fontWeight = '500';
  
  // Add an icon to the button
  installButton.innerHTML = '<i class="fas fa-download" style="margin-right: 8px;"></i> Install App';
});

// Handle the install button click
installButton.addEventListener('click', (e) => {
  // Hide the install button
  installButton.style.display = 'none';
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // Clear the deferredPrompt variable
    deferredPrompt = null;
  });
});

// Hide the install button when the app is installed
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  installButton.style.display = 'none';
});

// Handle offline/online status
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  // Notify user they are back online
  showNotification('You are back online!', 'success');
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
  // Notify user they are offline
  showNotification('You are offline. Some features may be limited.', 'warning');
});

// Notification function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  
  // Style the notification
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.left = '20px';
  notification.style.backgroundColor = type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3';
  notification.style.color = 'white';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.zIndex = '1001';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  notification.style.minWidth = '250px';
  notification.style.maxWidth = '400px';
  notification.style.transform = 'translateY(100px)';
  notification.style.opacity = '0';
  notification.style.transition = 'all 0.3s ease';
  
  // Style the notification content
  const content = notification.querySelector('.notification-content');
  content.style.display = 'flex';
  content.style.alignItems = 'center';
  content.style.gap = '10px';
  
  // Style the close button
  const closeButton = notification.querySelector('.notification-close');
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'white';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontSize = '16px';
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Close button event
  closeButton.addEventListener('click', () => {
    notification.style.transform = 'translateY(100px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // Auto close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.transform = 'translateY(100px)';
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
} 
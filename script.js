class DinnerSpinner {
    constructor() {
        this.meals = this.loadMeals();
        this.history = this.loadHistory();
        this.isSpinning = false;
        this.colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
            '#f8b500', '#ff8c94', '#a8e6cf', '#c7ceea', '#ffd3a5'
        ];
        this.init();
    }

    init() {
        this.migrateMeals();
        this.bindEvents();
        this.updateMealsDisplay();
        this.updateHistoryDisplay();
        this.updateSpinButton();
    }

    migrateMeals() {
        // Add emoji and color to existing meals that don't have them
        let needsSave = false;
        this.meals.forEach((meal, index) => {
            if (!meal.emoji) {
                meal.emoji = this.getEmojiForMeal(meal.name);
                needsSave = true;
            }
            if (!meal.color) {
                meal.color = this.colors[index % this.colors.length];
                needsSave = true;
            }
        });
        
        if (needsSave) {
            this.saveMeals();
        }
    }

    bindEvents() {
        // Meal input events
        document.getElementById('addMealBtn').addEventListener('click', () => this.addMeal());
        document.getElementById('mealInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMeal();
        });



        // Spinner events
        document.getElementById('spinBtn').addEventListener('click', () => this.spin());
        document.getElementById('spinAgainBtn').addEventListener('click', () => this.resetSpin());

        // Result events
        document.getElementById('getRecipeBtn').addEventListener('click', () => this.getRecipe());
        document.getElementById('addToHistoryBtn').addEventListener('click', () => this.addToHistory());

        // History events
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
    }

    addMeal() {
        const input = document.getElementById('mealInput');
        const mealName = input.value.trim();
        
        if (!mealName) {
            this.showNotification('Please enter a meal name', 'error');
            return;
        }

        if (this.meals.some(meal => meal.name.toLowerCase() === mealName.toLowerCase())) {
            this.showNotification('This meal is already in your list', 'warning');
            return;
        }

        const newMeal = {
            id: Date.now(),
            name: mealName,
            emoji: this.getEmojiForMeal(mealName),
            color: this.colors[this.meals.length % this.colors.length],
            dateAdded: new Date().toISOString()
        };

        this.meals.push(newMeal);
        this.saveMeals();
        this.updateMealsDisplay();
        this.updateSpinButton();
        input.value = '';
        
        this.showNotification('Meal added successfully!', 'success');
    }

    removeMeal(id) {
        this.meals = this.meals.filter(meal => meal.id !== id);
        this.saveMeals();
        this.updateMealsDisplay();
        this.updateSpinButton();
        this.showNotification('Meal removed', 'info');
    }

    editMeal(id) {
        const meal = this.meals.find(m => m.id === id);
        if (!meal) return;

        const newName = prompt('Edit meal name:', meal.name);
        if (newName && newName.trim()) {
            meal.name = newName.trim();
            this.saveMeals();
            this.updateMealsDisplay();
            this.showNotification('Meal updated!', 'success');
        }
    }

    updateMealsDisplay() {
        const mealsGrid = document.getElementById('mealsGrid');
        const emptyState = document.getElementById('emptyState');
        const mealCount = document.querySelector('.meal-count');
        
        mealCount.textContent = `(${this.meals.length})`;

        if (this.meals.length === 0) {
            mealsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        mealsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        mealsGrid.innerHTML = this.meals.map(meal => `
            <div class="meal-card" data-id="${meal.id}" style="background: ${meal.color || '#667eea'}">
                <div class="meal-info">
                    <span class="meal-emoji">${meal.emoji || '🍽️'}</span>
                    <h3>${meal.name}</h3>
                </div>
                <div class="meal-actions">
                    <button onclick="dinnerSpinner.editMeal(${meal.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="dinnerSpinner.removeMeal(${meal.id})" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateSpinnerWheel();
    }

    updateSpinnerWheel() {
        const spinnerWheel = document.getElementById('spinnerWheel');
        
        if (this.meals.length === 0) {
            spinnerWheel.innerHTML = '<div class="empty-wheel">Add meals to spin!</div>';
            return;
        }

        const segmentAngle = 360 / this.meals.length;

        spinnerWheel.innerHTML = this.meals.map((meal, index) => {
            const rotation = index * segmentAngle;
            const color = meal.color || this.colors[index % this.colors.length];
            
            return `
                <div class="spinner-segment" style="
                    transform: rotate(${rotation}deg);
                    background: ${color};
                    clip-path: polygon(0 0, 100% 0, 100% 100%);
                ">
                    <span style="
                        transform: rotate(${segmentAngle/2}deg); 
                        font-size: 2.2em;
                        position: absolute;
                        top: 30%;
                        right: 25%;
                        line-height: 1;
                    ">
                        ${meal.emoji || '🍽️'}
                    </span>
                </div>
            `;
        }).join('');
    }

    spin() {
        if (this.isSpinning) return;
        
        if (this.meals.length === 0) {
            this.showNotification('Add some meals first!', 'warning');
            return;
        }

        this.isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        const spinAgainBtn = document.getElementById('spinAgainBtn');
        const resultSection = document.getElementById('resultSection');
        
        spinBtn.disabled = true;
        spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Spinning...';
        
        // Hide previous results
        resultSection.style.display = 'none';
        spinAgainBtn.style.display = 'none';

        // Spin animation
        const spinnerWheel = document.getElementById('spinnerWheel');
        const spins = 5 + Math.random() * 5; // 5-10 full rotations
        const finalRotation = spins * 360 + Math.random() * 360;
        
        spinnerWheel.style.transform = `rotate(${finalRotation}deg)`;
        
        // Calculate which meal was selected
        const normalizedRotation = (360 - (finalRotation % 360)) % 360;
        const segmentAngle = 360 / this.meals.length;
        const selectedIndex = Math.floor(normalizedRotation / segmentAngle);
        const selectedMeal = this.meals[selectedIndex];

        // Show result after animation
        setTimeout(() => {
            this.showResult(selectedMeal);
            this.isSpinning = false;
            spinBtn.disabled = false;
            spinBtn.innerHTML = '<i class="fas fa-play"></i> Spin the Wheel!';
            spinAgainBtn.style.display = 'inline-flex';
        }, 4000);
    }

    showResult(meal) {
        const resultSection = document.getElementById('resultSection');
        const selectedMeal = document.getElementById('selectedMeal');
        
        selectedMeal.textContent = meal.name;
        resultSection.style.display = 'block';
        
        // Store selected meal for later use
        this.lastSelectedMeal = meal;
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
        this.showNotification(`🎉 Tonight's dinner: ${meal.name}!`, 'success');
    }

    resetSpin() {
        const spinAgainBtn = document.getElementById('spinAgainBtn');
        const resultSection = document.getElementById('resultSection');
        
        spinAgainBtn.style.display = 'none';
        resultSection.style.display = 'none';
        
        // Reset spinner rotation
        const spinnerWheel = document.getElementById('spinnerWheel');
        spinnerWheel.style.transform = 'rotate(0deg)';
        
        // Scroll back to spinner
        document.querySelector('.spinner-section').scrollIntoView({ behavior: 'smooth' });
    }

    getRecipe() {
        if (!this.lastSelectedMeal) return;
        
        const query = encodeURIComponent(this.lastSelectedMeal.name + ' recipe');
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }

    addToHistory() {
        if (!this.lastSelectedMeal) return;
        
        const historyItem = {
            id: Date.now(),
            meal: this.lastSelectedMeal.name,
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString()
        };
        
        this.history.unshift(historyItem);
        this.saveHistory();
        this.updateHistoryDisplay();
        this.showNotification('Added to history!', 'success');
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        const clearBtn = document.getElementById('clearHistoryBtn');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-history">No meals in history yet.</p>';
            clearBtn.style.display = 'none';
            return;
        }
        
        clearBtn.style.display = 'inline-flex';
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div>
                    <strong>${item.meal}</strong>
                    <div class="history-date">${item.date}</div>
                </div>
                <button onclick="dinnerSpinner.removeFromHistory(${item.id})" class="btn btn-danger" style="padding: 5px 10px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeFromHistory(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryDisplay();
            this.showNotification('History cleared', 'info');
        }
    }



    updateSpinButton() {
        const spinBtn = document.getElementById('spinBtn');
        
        spinBtn.disabled = this.meals.length === 0;
        
        if (this.meals.length === 0) {
            spinBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No meals to spin';
        } else {
            spinBtn.innerHTML = '<i class="fas fa-play"></i> Spin the Wheel!';
        }
    }

    getEmojiForMeal(mealName) {
        const name = mealName.toLowerCase();
        
        // Define emoji mappings based on keywords
        const emojiMap = {
            // Pasta dishes
            'pasta': '🍝', 'spaghetti': '🍝', 'linguine': '🍝', 'fettuccine': '🍝',
            'carbonara': '🍝', 'bolognese': '🍝', 'penne': '🍝', 'ravioli': '🍝',
            
            // Pizza
            'pizza': '🍕',
            
            // Asian dishes
            'ramen': '🍜', 'noodles': '🍜', 'pho': '🍜', 'udon': '🍜',
            'sushi': '🍣', 'sashimi': '🍣', 'maki': '🍣',
            'curry': '🍛', 'rice': '🍚', 'fried rice': '🍚',
            'stir fry': '🥘', 'pad thai': '🍜', 'lo mein': '🍜',
            
            // Mexican
            'taco': '🌮', 'tacos': '🌮', 'burrito': '🌯', 'quesadilla': '🌮',
            'enchilada': '🌮', 'fajita': '🌮',
            
            // Meat dishes
            'burger': '🍔', 'hamburger': '🍔', 'cheeseburger': '🍔',
            'steak': '🥩', 'beef': '🥩', 'pork': '🥩', 'lamb': '🥩',
            'chicken': '🍗', 'turkey': '🦃', 'duck': '🦆',
            'bacon': '🥓', 'ham': '🥓', 'sausage': '🌭', 'hotdog': '🌭',
            
            // Seafood
            'fish': '🐟', 'salmon': '🐟', 'tuna': '🐟', 'cod': '🐟',
            'shrimp': '🦐', 'lobster': '🦞', 'crab': '🦀', 'scallop': '🦪',
            
            // Soups and stews
            'soup': '🍲', 'stew': '🍲', 'chili': '🍲', 'broth': '🍲',
            
            // Breakfast
            'eggs': '🍳', 'omelet': '🍳', 'pancake': '🥞', 'waffle': '🧇',
            'toast': '🍞', 'bagel': '🥯', 'cereal': '🥣',
            
            // Salads
            'salad': '🥗', 'caesar': '🥗',
            
            // Sandwiches
            'sandwich': '🥪', 'sub': '🥪', 'panini': '🥪',
            
            // Desserts
            'cake': '🍰', 'pie': '🥧', 'cookie': '🍪', 'ice cream': '🍦',
            
            // Vegetables
            'vegetable': '🥕', 'veggie': '🥕', 'broccoli': '🥦', 'carrot': '🥕'
        };
        
        // Check for keywords in the meal name
        for (const [keyword, emoji] of Object.entries(emojiMap)) {
            if (name.includes(keyword)) {
                return emoji;
            }
        }
        
        // Default emoji if no match found
        return '🍽️';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            'success': '#4ecdc4',
            'error': '#ff6b6b',
            'warning': '#feca57',
            'info': '#667eea'
        };
        return colors[type] || '#667eea';
    }

    // Data persistence
    saveMeals() {
        localStorage.setItem('dinnerSpinnerMeals', JSON.stringify(this.meals));
    }

    loadMeals() {
        const saved = localStorage.getItem('dinnerSpinnerMeals');
        return saved ? JSON.parse(saved) : [];
    }

    saveHistory() {
        localStorage.setItem('dinnerSpinnerHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('dinnerSpinnerHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // Export functionality (bonus feature)
    exportData() {
        const data = {
            meals: this.meals,
            history: this.history,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dinner-spinner-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }


}

// Add CSS for notifications animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .empty-wheel {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #666;
        font-style: italic;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    }
`;
document.head.appendChild(style);

// Initialize the app
let dinnerSpinner;
document.addEventListener('DOMContentLoaded', () => {
    dinnerSpinner = new DinnerSpinner();
    
    // Add personalized default meals (only if no meals exist)
    if (dinnerSpinner.meals.length === 0) {
        const sampleMeals = [
            { id: 1, name: "Grilled Salmon w/ Greens", emoji: "🐟", color: "#ff6b6b" },
            { id: 2, name: "Chicken Thighs w/ Rice", emoji: "🍚", color: "#4ecdc4" },
            { id: 3, name: "Scrambled Eggs w/ Salad", emoji: "🍳", color: "#45b7d1" },
            { id: 4, name: "Pasta w/ Red Sauce", emoji: "🍝", color: "#96ceb4" },
            { id: 5, name: "Pizza!", emoji: "🍕", color: "#ffeaa7" },
            { id: 6, name: "Hot Dogs w/ Potatoes", emoji: "🌭", color: "#dda0dd" },
            { id: 7, name: "Cheese Toast", emoji: "🍞", color: "#98d8c8" },
            { id: 8, name: "Steak w/ Fries", emoji: "🥩", color: "#f7dc6f" },
            { id: 9, name: "Tuna Sandwich", emoji: "🥪", color: "#bb8fce" },
            { id: 10, name: "Cornflakes w/ Milk", emoji: "🥣", color: "#85c1e9" }
        ];
        
        dinnerSpinner.meals = sampleMeals;
        dinnerSpinner.saveMeals();
        dinnerSpinner.updateMealsDisplay();
        dinnerSpinner.updateSpinButton();
    }
}); 

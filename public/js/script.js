document.getElementById('sidebarToggle').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('active');
});

// Chart Example
const ctx = document.getElementById('salesChart');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
            label: 'Sales',
            data: [1200, 1900, 3000, 2500, 3200],
            borderColor: 'blue',
            fill: false
        }]
    }
});

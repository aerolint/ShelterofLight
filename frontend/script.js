const API_BASE = 'http://localhost/shelteroflight_v3/backend/';
alert("loading lang po");
console.log('gumagana sya, gumagana sya!!');

async function apiCall(endpoint, method = 'POST', data = null) {
    const options = { method };
    if (data) options.body = data;

    try {
        const response = await fetch(API_BASE + endpoint, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Call failed (${endpoint}):`, error);
        return { success: false, message: 'Server communication error.' };
    }
}

async function loginUser(email, password) {
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('password', password);
    try {
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Login response:', result);
        return result;
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function registerUser(name, email, password) {
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    try {
        const response = await fetch(API_BASE + 'auth.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Register response:', result);
        return result;
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function addAnimal(animalData) {
    const formData = new FormData();
    formData.append('action', 'add');
    formData.append('name', animalData.name);
    formData.append('age', animalData.age);
    formData.append('gender', animalData.gender || '');
    formData.append('species', animalData.species || '');
    formData.append('status', animalData.status);
    formData.append('vet', animalData.vet || '');
    formData.append('notes', animalData.notes || '');
    if (animalData.photo) {
        formData.append('photo', animalData.photo);
    }
    try {
        const response = await fetch(API_BASE + 'manage_rescues.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Add animal response:', result);
        return result;
    } catch (error) {
        console.error('Add animal error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function getAllAnimals() {
    try {
        const response = await fetch(API_BASE + 'manage_rescues.php?action=list', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        console.log('Get all animals response:', result);
        return result;
    } catch (error) {
        console.error('Get all animals error:', error);
        return { success: false, message: 'Network error', data: [] };
    }
}

async function getAnimalById(animalId) {
    const formData = new FormData();
    formData.append('action', 'get_one');
    formData.append('id', animalId);
    try {
        const response = await fetch(API_BASE + 'manage_rescues.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Get animal response:', result);
        return result;
    } catch (error) {
        console.error('Get animal error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function updateAnimalStatus(animalId, newStatus, notes) {
    const formData = new FormData();
    formData.append('action', 'update');
    formData.append('id', animalId);
    formData.append('status', newStatus);
    formData.append('notes', notes || '');
    try {
        const response = await fetch(API_BASE + 'manage_rescues.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Update status response:', result);
        return result;
    } catch (error) {
        console.error('Update status error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function deleteAnimal(animalId) {
    const fd = new FormData();
    fd.append('action', 'delete');
    fd.append('id', animalId);
    return await apiCall('manage_rescues.php', 'POST', fd);
}

async function submitDonation(donationData) {
    const formData = new FormData();
    formData.append('action', 'submit');
    formData.append('donor_name', donationData.name);
    formData.append('amount', donationData.amount);
    formData.append('date', donationData.date);
    formData.append('channel', donationData.channel);
    formData.append('reference', donationData.reference);
    formData.append('message', donationData.message || '');
    if (donationData.screenshot) {
        formData.append('screenshot', donationData.screenshot);
    }
    try {
        const response = await fetch(API_BASE + 'donations.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Submit donation response:', result);
        return result;
    } catch (error) {
        console.error('Submit donation error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function verifyDonation(donationId, action) {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('id', donationId);
    try {
        const response = await fetch(API_BASE + 'donations.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Verify donation response:', result);
        return result;
    } catch (error) {
        console.error('Verify donation error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function getPendingDonations() {
    const formData = new FormData();
    formData.append('action', 'get_pending');
    try {
        const response = await fetch(API_BASE + 'donations.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Get pending donations response:', result);
        return result;
    } catch (error) {
        console.error('Get pending donations error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function getAllDonations() {
    const formData = new FormData();
    formData.append('action', 'get_all');
    try {
        const response = await fetch(API_BASE + 'donations.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Get all donations response:', result);
        return result;
    } catch (error) {
        console.error('Get all donations error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function submitAdoption(data) {
    const formData = new FormData();
    formData.append('action', 'submit');
    formData.append('rescue_id', data.rescue_id || data.animalId || 0);
    formData.append('applicant_name', data.applicant_name || data.name || '');
    formData.append('applicant_email', data.applicant_email || data.email || '');
    formData.append('motivation', data.motivation || data.message || '');
    try {
        const response = await fetch(API_BASE + 'adoptions.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Adoption response:', result);
        return result;
    } catch (error) {
        console.error('Adoption error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function getAdoptions() {
    const formData = new FormData();
    formData.append('action', 'list');
    try {
        const response = await fetch(API_BASE + 'adoptions.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Adoptions list:', result);
        return result;
    } catch (error) {
        console.error('Get adoptions error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function trackAdoption(email, code) {
    const formData = new FormData();
    formData.append('action', 'track');
    formData.append('email', email);
    formData.append('code', code);
    try {
        const response = await fetch(API_BASE + 'adoptions.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Track adoption:', result);
        return result;
    } catch (error) {
        console.error('Track adoption error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function updateAdoptionStatus(applicationId, status) {
    const formData = new FormData();
    formData.append('action', 'update_status');
    formData.append('application_id', applicationId);
    formData.append('status', status);
    try {
        const response = await fetch(API_BASE + 'adoptions.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Update status response:', result);
        return result;
    } catch (error) {
        console.error('Update status error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function deleteAdoption(applicationId) {
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('application_id', applicationId);
    try {
        const response = await fetch(API_BASE + 'adoptions.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Delete adoption response:', result);
        return result;
    } catch (error) {
        console.error('Delete adoption error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function addMedicalLog(logData) {
    const formData = new FormData();
    formData.append('action', 'add_log');
    formData.append('animal_id', logData.animalId);
    formData.append('vet_name', logData.vetName);
    formData.append('diagnosis', logData.diagnosis);
    formData.append('treatment', logData.treatment);
    formData.append('medications', logData.medications || '');
    formData.append('notes', logData.notes || '');
    try {
        const response = await fetch(API_BASE + 'medical_logger.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Add medical log response:', result);
        return result;
    } catch (error) {
        console.error('Add medical log error:', error);
        return { success: false, message: 'Network error' };
    }
}

async function getMedicalHistory(animalId) {
    const formData = new FormData();
    formData.append('action', 'get_history');
    formData.append('animal_id', animalId);
    try {
        const response = await fetch(API_BASE + 'medical_logger.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        console.log('Get medical history response:', result);
        return result;
    } catch (error) {
        console.error('Get medical history error:', error);
        return { success: false, message: 'Network error' };
    }
}

function showNotification(message, type = 'success') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${colors[type] || colors.info};
        color: ${type === 'warning' ? '#000' : '#fff'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        font-weight: 600;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function validateForm(data, requiredFields) {
    for (let field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === "") {
            showNotification(`Missing field: ${field}`, 'warning');
            return false;
        }
    }
    return true;
}

async function loadCategoryGallery(categoryName) {
    const container = document.getElementById('pet-gallery');
    if (!container) return;
    
    container.innerHTML = '<p>Loading rescues...</p>'; 

    try {
        const result = await getAllAnimals(); 
        console.log('Load category result:', result);

        if (result.success && result.data) {
            const pets = result.data.filter(pet => pet.Status === categoryName);
            
            if (pets.length === 0) {
                container.innerHTML = '<p>No pets found in this category.</p>';
                return;
            }

            container.innerHTML = pets.map(pet => `
                <div class="img-box" onclick='openDynamicModal(${JSON.stringify(pet).replace(/'/g, "\\'")})'>
                    <img src="${pet.Photo_Path || 'https://via.placeholder.com/220x220/2d2d2d/FFD946?text=' + encodeURIComponent(pet.Name || 'Pet')}" alt="${pet.Name}" loading="lazy">
                    <p>${pet.Name}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Failed to load data: ' + (result.message || 'Unknown error') + '</p>';
        }
    } catch (err) {
        console.error('Load category error:', err);
        container.innerHTML = '<p>Failed to load data: ' + err.message + '</p>';
    }
}

function openDynamicModal(pet) {
    document.getElementById('modalName').innerText = pet.Name || 'Unknown';
    document.getElementById('modalSpecies').innerText = pet.Species || 'N/A';
    document.getElementById('modalId').innerText = pet.Rescue_ID || 'N/A';
    document.getElementById('modalBreed').innerText = pet.Breed || 'N/A';
    document.getElementById('modalSex').innerText = pet.Sex || 'N/A';
    document.getElementById('modalFixed').innerText = pet.Spayed_Neutered == 1 ? 'Yes' : 'No';
    document.getElementById('modalLocation').innerText = pet.Found_Location || 'N/A';
    document.getElementById('modalAge').innerText = pet.Found_Age || 'N/A';
    document.getElementById('modalHealth').innerText = pet.Current_Health_Status || 'N/A';
    document.getElementById('modalClinic').innerText = pet.Veterinary_Clinic || 'N/A';
    document.getElementById('modalImg').innerHTML = `<img src="${pet.Photo_Path || 'https://via.placeholder.com/400x400/2d2d2d/FFD946?text=' + encodeURIComponent(pet.Name || 'Pet')}" alt="${pet.Name}" style="width:100%;">`;
    
    document.getElementById('petModal').style.display = 'block';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

let currentSlide = 0;
let carouselData = [];
let carouselInterval = null;

async function loadCarouselPets() {
    try {
        const result = await getAllAnimals();
        if (result.success && result.data) {
            const availablePets = result.data.filter(pet => 
                pet.Status === 'Available for Adoption' || 
                pet.Status === 'Available'
            );
            carouselData = availablePets;
            renderCarousel();
            startCarousel();
        }
    } catch (error) {
        console.error('Error loading carousel:', error);
    }
}

function renderCarousel() {
    const slidesContainer = document.getElementById('carouselSlides');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!slidesContainer) return;
    
    if (carouselData.length === 0) {
        slidesContainer.innerHTML = `
            <div class="carousel-slide">
                <div class="carousel-slide-content">
                    <h2>🐾 No Pets Available Yet</h2>
                    <p>Check back soon for our adoptable animals!</p>
                </div>
            </div>
        `;
        return;
    }
    
    slidesContainer.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    carouselData.forEach((pet, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.display = index === 0 ? 'flex' : 'none';
        const imageUrl = pet.Photo_Path || 'https://via.placeholder.com/1200x500/2d2d2d/FFD946?text=' + encodeURIComponent(pet.Name || 'Pet');
        slide.innerHTML = `
            <img src="${imageUrl}" alt="${pet.Name || 'Pet'}">
            <div class="carousel-slide-content">
                <h2>${pet.Name || 'Unnamed'}</h2>
                <div class="pet-details">
                    <span>🐕 ${pet.Species || 'Pet'}</span>
                    <span>${pet.Breed || 'Mixed'}</span>
                    <span>${pet.Age || 'Unknown age'}</span>
                </div>
                <p>${pet.Description || 'Looking for a loving home!'}</p>
                <a href="adoption-form.html?pet=${pet.Rescue_ID}" class="btn-adopt">Adopt Me</a>
            </div>
        `;
        slidesContainer.appendChild(slide);
        
        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        }
    });
}

function changeSlide(direction) {
    if (carouselData.length === 0) return;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length === 0) return;
    
    slides[currentSlide].style.display = 'none';
    if (dots.length > 0) dots[currentSlide].classList.remove('active');
    
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    
    slides[currentSlide].style.display = 'flex';
    if (dots.length > 0) dots[currentSlide].classList.add('active');
    
    resetCarouselTimer();
}

function goToSlide(index) {
    if (carouselData.length === 0 || index === currentSlide) return;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length === 0) return;
    
    slides[currentSlide].style.display = 'none';
    if (dots.length > 0) dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].style.display = 'flex';
    if (dots.length > 0) dots[currentSlide].classList.add('active');
    
    resetCarouselTimer();
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (carouselData.length > 1) {
        carouselInterval = setInterval(() => changeSlide(1), 5000);
    }
}

function resetCarouselTimer() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        if (carouselData.length > 1) {
            carouselInterval = setInterval(() => changeSlide(1), 5000);
        }
    }
}

window.changeSlide = changeSlide;
window.goToSlide = goToSlide;
window.loadCarouselPets = loadCarouselPets;
window.openDynamicModal = openDynamicModal;
window.loadCategoryGallery = loadCategoryGallery;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    loadCarouselPets();
    
    if (document.getElementById('specialNeedsCarousel')) {
        loadSpecialNeedsCarousel();
    }
    if (document.getElementById('newlyAdmittedCarousel')) {
        loadNewlyAdmittedCarousel();
    }
});
// ============================================
// PET CAROUSEL FUNCTIONS
// ============================================

let specialNeedsIndex = 0;
let newlyAdmittedIndex = 0;
let specialNeedsPets = [];
let newlyAdmittedPets = [];

async function loadSpecialNeedsCarousel() {
    const container = document.getElementById('specialNeedsCarousel');
    const dotsContainer = document.getElementById('specialNeedsDots');
    if (!container) return;
    
    try {
        const result = await getAllAnimals();
        if (result.success && result.data) {
            specialNeedsPets = result.data.filter(pet => 
                pet.Status === 'Special Needs' || 
                pet.Status === 'Special Needs (Permanent)'
            );
            
            if (specialNeedsPets.length === 0) {
                container.innerHTML = `<p style="color: #aaa; padding: 40px;">No special needs pets available.</p>`;
                return;
            }
            
            renderPetCarousel(container, dotsContainer, specialNeedsPets, 'specialNeeds');
            specialNeedsIndex = 0;
            updatePetCarousel(container, dotsContainer, specialNeedsPets, specialNeedsIndex, 'specialNeeds');
        }
    } catch (error) {
        console.error('Error loading special needs carousel:', error);
        container.innerHTML = `<p style="color: #aaa; padding: 40px;">Error loading pets.</p>`;
    }
}

async function loadNewlyAdmittedCarousel() {
    const container = document.getElementById('newlyAdmittedCarousel');
    const dotsContainer = document.getElementById('newlyAdmittedDots');
    if (!container) return;
    
    try {
        const result = await getAllAnimals();
        if (result.success && result.data) {
            newlyAdmittedPets = result.data.filter(pet => 
                pet.Status === 'Newly Admitted'
            );
            
            if (newlyAdmittedPets.length === 0) {
                container.innerHTML = `<p style="color: #aaa; padding: 40px;">No newly admitted pets available.</p>`;
                return;
            }
            
            renderPetCarousel(container, dotsContainer, newlyAdmittedPets, 'newlyAdmitted');
            newlyAdmittedIndex = 0;
            updatePetCarousel(container, dotsContainer, newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
        }
    } catch (error) {
        console.error('Error loading newly admitted carousel:', error);
        container.innerHTML = `<p style="color: #aaa; padding: 40px;">Error loading pets.</p>`;
    }
}

function renderPetCarousel(container, dotsContainer, pets, type) {
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    // Calculate cards per view (responsive)
    let cardsPerView = 3;
    if (window.innerWidth < 768) cardsPerView = 1;
    else if (window.innerWidth < 1024) cardsPerView = 2;
    
    const totalSlides = Math.ceil(pets.length / cardsPerView);
    
    for (let i = 0; i < totalSlides; i++) {
        const slide = document.createElement('div');
        slide.className = 'pet-carousel-slide';
        slide.style.minWidth = '100%';
        slide.style.display = 'flex';
        slide.style.gap = '20px';
        slide.style.justifyContent = 'center';
        slide.style.padding = '0 10px';
        slide.style.flexWrap = 'wrap';
        
        const start = i * cardsPerView;
        const end = Math.min(start + cardsPerView, pets.length);
        
        for (let j = start; j < end; j++) {
            const pet = pets[j];
            const card = createPetCard(pet);
            slide.appendChild(card);
        }
        
        container.appendChild(slide);
        
        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'pet-carousel-dot' + (i === 0 ? ' active' : '');
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            dot.style.background = i === 0 ? '#FFD946' : 'rgba(255,255,255,0.3)';
            dot.style.cursor = 'pointer';
            dot.style.transition = 'all 0.3s ease';
            dot.style.display = 'inline-block';
            dot.style.margin = '0 5px';
            dot.onclick = () => goToPetSlide(i, type);
            dotsContainer.appendChild(dot);
        }
    }
}

function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.style.background = '#1a1a1a';
    card.style.borderRadius = '16px';
    card.style.overflow = 'hidden';
    card.style.border = '1px solid rgba(255,217,70,0.08)';
    card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    card.style.flex = '1';
    card.style.minWidth = '250px';
    card.style.maxWidth = '350px';
    
    const imageUrl = pet.Photo_Path || 'https://via.placeholder.com/400x300/2d2d2d/FFD946?text=' + encodeURIComponent(pet.Name || 'Pet');
    const statusClass = (pet.Status === 'Special Needs' || pet.Status === 'Special Needs (Permanent)') ? 'status-special' : 'status-newly';
    const statusColor = (pet.Status === 'Special Needs' || pet.Status === 'Special Needs (Permanent)') ? '#dc3545' : '#17a2b8';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${pet.Name}" class="pet-card-image" style="width: 100%; height: 220px; object-fit: cover; background: #2d2d2d;" onerror="this.src='https://via.placeholder.com/400x300/2d2d2d/FFD946?text=No+Image'">
        <div class="pet-card-content" style="padding: 18px 20px 20px;">
            <div class="pet-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <h3 style="color: #FFD946; font-size: 22px; font-weight: 700; margin: 0;">${pet.Name || 'Unnamed'}</h3>
                <span class="pet-card-status ${statusClass}" style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: ${statusColor}; color: #fff;">${pet.Status || 'Available'}</span>
            </div>
            <div class="pet-card-details" style="display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0 10px;">
                <span style="background: rgba(255,255,255,0.06); padding: 3px 14px; border-radius: 12px; font-size: 13px; color: #ccc;">🐕 ${pet.Species || 'Pet'}</span>
                <span style="background: rgba(255,255,255,0.06); padding: 3px 14px; border-radius: 12px; font-size: 13px; color: #ccc;">${pet.breed || 'Mixed'}</span>
            </div>
            <p class="pet-card-description" style="color: #aaa; font-size: 14px; line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">Looking for a loving home!</p>
            <div class="pet-card-actions" style="display: flex; gap: 10px;">
                <a href="adoption-form.html?pet=${pet.Rescue_ID}" class="btn-adopt" style="flex: 1; text-align: center; background: #FFD946; color: #000; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-weight: 700; font-size: 14px; transition: all 0.3s ease;">Adopt Me</a>
                <button class="btn-details" onclick='openModalFromPet(${JSON.stringify(pet).replace(/'/g, "\\'")})' style="background: transparent; color: #FFD946; border: 1px solid #FFD946; padding: 10px 18px; border-radius: 25px; font-weight: 600; font-size: 14px; transition: all 0.3s ease; cursor: pointer;">Details</button>
            </div>
        </div>
    `;
    
    card.onmouseenter = function() {
        this.style.transform = 'translateY(-6px)';
        this.style.boxShadow = '0 8px 30px rgba(255,217,70,0.1)';
        this.style.borderColor = 'rgba(255,217,70,0.2)';
    };
    card.onmouseleave = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
        this.style.borderColor = 'rgba(255,217,70,0.08)';
    };
    
    return card;
}

function updatePetCarousel(container, dotsContainer, pets, index, type) {
    const slides = container.querySelectorAll('.pet-carousel-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.pet-carousel-dot') : [];
    
    if (slides.length === 0) return;
    
    slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'flex' : 'none';
    });
    
    dots.forEach((dot, i) => {
        dot.style.background = i === index ? '#FFD946' : 'rgba(255,255,255,0.3)';
        dot.style.transform = i === index ? 'scale(1.2)' : 'scale(1)';
    });
}

function scrollSpecialNeeds(direction) {
    const container = document.getElementById('specialNeedsCarousel');
    const dotsContainer = document.getElementById('specialNeedsDots');
    const slides = container.querySelectorAll('.pet-carousel-slide');
    if (slides.length === 0) return;
    
    specialNeedsIndex = (specialNeedsIndex + direction + slides.length) % slides.length;
    updatePetCarousel(container, dotsContainer, specialNeedsPets, specialNeedsIndex, 'specialNeeds');
}

function scrollNewlyAdmitted(direction) {
    const container = document.getElementById('newlyAdmittedCarousel');
    const dotsContainer = document.getElementById('newlyAdmittedDots');
    const slides = container.querySelectorAll('.pet-carousel-slide');
    if (slides.length === 0) return;
    
    newlyAdmittedIndex = (newlyAdmittedIndex + direction + slides.length) % slides.length;
    updatePetCarousel(container, dotsContainer, newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
}

function goToPetSlide(index, type) {
    if (type === 'specialNeeds') {
        specialNeedsIndex = index;
        const container = document.getElementById('specialNeedsCarousel');
        const dotsContainer = document.getElementById('specialNeedsDots');
        updatePetCarousel(container, dotsContainer, specialNeedsPets, specialNeedsIndex, 'specialNeeds');
    } else if (type === 'newlyAdmitted') {
        newlyAdmittedIndex = index;
        const container = document.getElementById('newlyAdmittedCarousel');
        const dotsContainer = document.getElementById('newlyAdmittedDots');
        updatePetCarousel(container, dotsContainer, newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
    }
}

window.scrollSpecialNeeds = scrollSpecialNeeds;
window.scrollNewlyAdmitted = scrollNewlyAdmitted;
window.goToPetSlide = goToPetSlide;
window.loadSpecialNeedsCarousel = loadSpecialNeedsCarousel;
window.loadNewlyAdmittedCarousel = loadNewlyAdmittedCarousel;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.addAnimal = addAnimal;
window.getAllAnimals = getAllAnimals;
window.getAnimalById = getAnimalById;
window.updateAnimalStatus = updateAnimalStatus;
window.deleteAnimal = deleteAnimal;
window.submitDonation = submitDonation;
window.verifyDonation = verifyDonation;
window.getPendingDonations = getPendingDonations;
window.getAllDonations = getAllDonations;
window.submitAdoption = submitAdoption;
window.getAdoptions = getAdoptions;
window.trackAdoption = trackAdoption;
window.updateAdoptionStatus = updateAdoptionStatus;
window.deleteAdoption = deleteAdoption;
window.addMedicalLog = addMedicalLog;
window.getMedicalHistory = getMedicalHistory;
window.showNotification = showNotification;
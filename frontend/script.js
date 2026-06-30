/* ============================================================
   Shelter of Light — Shared frontend API layer
   Single source of truth for ALL pages (user + admin).

   API_BASE is RELATIVE so it works regardless of the folder
   name Apache serves the project under. Every HTML page lives
   two levels deep (frontend/user/* or frontend/admin/*), and the
   backend sits at <project>/backend/, so ../../backend/ resolves
   correctly from any page. Requests are same-origin, so the PHP
   session cookie is sent automatically.
   ============================================================ */
const API_BASE = '../../backend/';

console.log('Shelter of Light frontend loaded.');

/* ---------- low-level helpers ---------- */

async function apiGet(endpoint) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
            return { success: false, message: `Server error (HTTP ${response.status}).` };
        }
        return await response.json();
    } catch (error) {
        console.error(`GET ${endpoint} failed:`, error);
        return { success: false, message: 'Server communication error.' };
    }
}

async function apiPost(endpoint, formData) {
    try {
        const response = await fetch(API_BASE + endpoint, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData,
        });
        // Some admin endpoints redirect (302 -> HTML) when not authenticated.
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            console.error(`POST ${endpoint} did not return JSON:`, text.slice(0, 200));
            return { success: false, message: 'You may need to log in as an admin to do that.' };
        }
    } catch (error) {
        console.error(`POST ${endpoint} failed:`, error);
        return { success: false, message: 'Server communication error.' };
    }
}

function fd(obj) {
    const f = new FormData();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null) f.append(k, v);
    });
    return f;
}

// HTML-escape any value before interpolating it into innerHTML / attributes.
// Pet/applicant fields come from the database (admin-entered) and must not be
// trusted as markup, or a stored value like "<img onerror=...>" becomes XSS.
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
}

/* ============================================================
   AUTH  (auth.php — POST only)
   ============================================================ */

async function loginUser(username, password) {
    return apiPost('auth.php', fd({ action: 'login', username, password }));
}

async function registerUser(data) {
    return apiPost('auth.php', fd({
        action: 'register',
        username: data.username,
        password: data.password,
        confirm_password: data.confirm_password ?? data.password,
        full_name: data.full_name ?? '',
        email: data.email ?? '',
        contact_number: data.contact_number ?? '',
    }));
}

async function logoutUser() {
    return apiPost('auth.php', fd({ action: 'logout' }));
}

/* ============================================================
   RESCUES  (manage_rescues.php)
   ============================================================ */

async function getAllAnimals() {
    return apiGet('manage_rescues.php?action=list');
}

async function getAnimalsGrouped() {
    return apiGet('manage_rescues.php?action=grouped');
}

async function getAnimalById(rescueId) {
    return apiGet('manage_rescues.php?action=single&id=' + encodeURIComponent(rescueId));
}

async function getRainbowAnimals() {
    return apiGet('manage_rescues.php?action=rainbow');
}

// animalData: { name, species, breed, status, memorial_note, photo (File) }
async function addAnimal(animalData) {
    return apiPost('manage_rescues.php', fd({
        action: 'create',
        name: animalData.name,
        species: animalData.species,
        breed: animalData.breed,
        status: animalData.status,
        memorial_note: animalData.memorial_note,
        photo: animalData.photo,
    }));
}

async function updateAnimal(animalData) {
    return apiPost('manage_rescues.php', fd({
        action: 'update',
        rescue_id: animalData.rescue_id,
        name: animalData.name,
        species: animalData.species,
        breed: animalData.breed,
        status: animalData.status,
        memorial_note: animalData.memorial_note,
        photo: animalData.photo,
    }));
}

async function updateAnimalStatus(rescueId, newStatus, memorialNote) {
    return apiPost('manage_rescues.php', fd({
        action: 'update_status',
        rescue_id: rescueId,
        status: newStatus,
        memorial_note: memorialNote ?? '',
    }));
}

async function deleteAnimal(rescueId) {
    return apiPost('manage_rescues.php', fd({ action: 'delete', rescue_id: rescueId }));
}

/* ============================================================
   DONATIONS  (donations.php)
   ============================================================ */

// donationData: { sender_name, transaction_date (YYYY-MM-DD), amount_php,
//                 payment_channel, reference_number, optional_message,
//                 screenshot (File), rescue_id }
async function submitDonation(donationData) {
    return apiPost('donations.php', fd({
        action: 'submit',
        sender_name: donationData.sender_name,
        transaction_date: donationData.transaction_date,
        amount_php: donationData.amount_php,
        payment_channel: donationData.payment_channel,
        reference_number: donationData.reference_number,
        optional_message: donationData.optional_message,
        rescue_id: donationData.rescue_id,
        screenshot: donationData.screenshot,
    }));
}

async function getPendingDonations() {
    return apiGet('donations.php?action=pending');
}

async function getAllDonations() {
    return apiGet('donations.php?action=list');
}

async function verifyDonation(donationId) {
    return apiPost('donations.php', fd({ action: 'verify', donation_id: donationId }));
}

async function unverifyDonation(donationId) {
    return apiPost('donations.php', fd({ action: 'unverify', donation_id: donationId }));
}

async function deleteDonation(donationId) {
    return apiPost('donations.php', fd({ action: 'delete', donation_id: donationId }));
}

/* ============================================================
   ADOPTIONS  (adoptions.php)
   ============================================================ */

// data: { rescue_id, applicant_name, applicant_email, motivation }
async function submitAdoption(data) {
    return apiPost('adoptions.php', fd({
        action: 'submit',
        rescue_id: data.rescue_id,
        applicant_name: data.applicant_name,
        applicant_email: data.applicant_email,
        motivation: data.motivation,
    }));
}

async function getAdoptions() {
    return apiGet('adoptions.php?action=list');
}

async function getPendingAdoptions() {
    return apiGet('adoptions.php?action=pending');
}

async function trackAdoption(email, code) {
    return apiGet('adoptions.php?action=track&email=' +
        encodeURIComponent(email) + '&code=' + encodeURIComponent(code));
}

async function updateAdoptionStatus(applicationId, status) {
    return apiPost('adoptions.php', fd({
        action: 'update_status',
        application_id: applicationId,
        status,
    }));
}

async function deleteAdoption(applicationId) {
    return apiPost('adoptions.php', fd({ action: 'delete', application_id: applicationId }));
}

/* ============================================================
   MEDICAL RECORDS  (medical_logger.php)
   ============================================================ */

async function getMedicalHistory(rescueId) {
    return apiGet('medical_logger.php?action=history&rescue_id=' + encodeURIComponent(rescueId));
}

async function getAllMedicalRecords() {
    return apiGet('medical_logger.php?action=all');
}

async function getClinics() {
    return apiGet('medical_logger.php?action=clinics');
}

async function getRescueDropdown() {
    return apiGet('medical_logger.php?action=animals');
}

// logData: { rescue_id, clinic_id, treatment_date (YYYY-MM-DD), diagnosis }
async function addMedicalLog(logData) {
    return apiPost('medical_logger.php', fd({
        action: 'log',
        rescue_id: logData.rescue_id,
        clinic_id: logData.clinic_id,
        treatment_date: logData.treatment_date,
        diagnosis: logData.diagnosis,
    }));
}

async function deleteMedicalRecord(recordId) {
    return apiPost('medical_logger.php', fd({ action: 'delete', record_id: recordId }));
}

/* ============================================================
   ADMIN DASHBOARD  (admin_dashboard.php)
   ============================================================ */

async function getDashboard(widget = 'all') {
    return apiGet('admin_dashboard.php?widget=' + encodeURIComponent(widget));
}

/* ============================================================
   UI HELPERS
   ============================================================ */

function showNotification(message, type = 'success') {
    const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
    const n = document.createElement('div');
    n.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: ${colors[type] || colors.info};
        color: ${type === 'warning' ? '#000' : '#fff'};
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 9999; font-weight: 600; max-width: 400px; animation: slideIn 0.3s ease;`;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.opacity = '0';
        n.style.transition = 'opacity 0.3s ease';
        setTimeout(() => n.remove(), 300);
    }, 4000);
}

// Surfaces either a single .message or a list of .errors from the backend.
function apiErrorText(result) {
    if (result && Array.isArray(result.errors) && result.errors.length) {
        return result.errors.join('\n');
    }
    return (result && result.message) || 'Something went wrong.';
}

function validateForm(data, requiredFields) {
    for (const field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === '') {
            showNotification(`Missing field: ${field}`, 'warning');
            return false;
        }
    }
    return true;
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(style);

/* ============================================================
   PUBLIC GALLERY + MODAL
   NOTE: the Rescues table only stores Name, Species, Breed,
   Status, Photo_Path and Memorial_Note. Fields like Sex,
   Spayed/Neutered, Found Location/Age, Health and Clinic are
   shown as "N/A" because those columns do not exist yet.
   ============================================================ */

let currentPets = [];

async function loadCategoryGallery(categoryName) {
    const container = document.getElementById('pet-gallery');
    if (!container) return;
    container.innerHTML = '<p>Loading rescues...</p>';

    const result = await getAllAnimals();
    if (!result.success || !Array.isArray(result.data)) {
        container.innerHTML = '<p>Failed to load data: ' + apiErrorText(result) + '</p>';
        return;
    }

    currentPets = (categoryName === '*' || categoryName === 'All')
        ? result.data
        : result.data.filter(p => p.Status === categoryName);
    if (currentPets.length === 0) {
        container.innerHTML = '<p>No pets found in this category.</p>';
        return;
    }

    container.innerHTML = currentPets.map((pet, index) => `
        <div class="img-box" onclick="handlePetClick(${index})">
            <img src="${esc(petImage(pet))}" alt="${esc(pet.Name)}" loading="lazy"
                 onerror="this.onerror=null;this.src=PLACEHOLDER_IMG">
            <p>${esc(pet.Name)}</p>
        </div>`).join('');
}

function handlePetClick(index) {
    openDynamicModal(currentPets[index]);
}

// Local, no-network placeholder (an inline SVG). The seeded rescues have no
// Photo_Path, and external placeholder services are unreliable/blocked.
function placeholderImage(text) {
    const label = String(text || 'Pet').replace(/[<>&"]/g, '');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
        '<rect width="100%" height="100%" fill="#2d2d2d"/>' +
        '<text x="50%" y="50%" fill="#FFD946" font-family="sans-serif" font-size="26" ' +
        'text-anchor="middle" dominant-baseline="middle">' + label + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
const PLACEHOLDER_IMG = placeholderImage('No Image');

// Stored Photo_Path is web-root-relative to the backend (e.g. /uploads/rescues/x.jpg),
// so prefix the backend folder to reach it from a frontend page.
function petImage(pet) {
    return pet.Photo_Path ? ('../../backend' + pet.Photo_Path) : placeholderImage(pet.Name);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function openDynamicModal(pet) {
    setText('modalName', pet.Name || 'Unknown');
    setText('modalSpecies', pet.Species || 'N/A');
    setText('modalId', pet.Rescue_ID || 'N/A');
    setText('modalBreed', pet.Breed || 'N/A');
    setText('modalSex', pet.Sex || 'N/A');
    setText('modalFixed', pet.Spayed_Neutered == 1 ? 'Yes' : 'N/A');
    setText('modalLocation', pet.Found_Location || 'N/A');
    setText('modalAge', pet.Found_Age || 'N/A');
    setText('modalHealth', pet.Current_Health_Status || pet.Status || 'N/A');
    setText('modalClinic', pet.Veterinary_Clinic || 'N/A');
    const img = document.getElementById('modalImg');
    if (img) img.innerHTML = `<img src="${esc(petImage(pet))}" alt="${esc(pet.Name)}" style="width:100%;">`;
    const modal = document.getElementById('petModal');
    if (modal) modal.style.display = 'block';
}

/* ============================================================
   HOMEPAGE CAROUSELS
   ============================================================ */

let currentSlide = 0;
let carouselData = [];
let carouselInterval = null;

async function loadCarouselPets() {
    const result = await getAllAnimals();
    if (!result.success || !Array.isArray(result.data)) return;
    carouselData = result.data.filter(pet =>
        pet.Status === 'Looking for Foster' || pet.Status === 'Newly Admitted');
    renderCarousel();
    startCarousel();
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
            </div>`;
        return;
    }

    slidesContainer.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    carouselData.forEach((pet, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.style.display = index === 0 ? 'flex' : 'none';
        slide.innerHTML = `
            <img src="${esc(petImage(pet))}" alt="${esc(pet.Name || 'Pet')}">
            <div class="carousel-slide-content">
                <h2>${esc(pet.Name || 'Unnamed')}</h2>
                <div class="pet-details">
                    <span>🐕 ${esc(pet.Species || 'Pet')}</span>
                    <span>${esc(pet.Breed || 'Mixed')}</span>
                </div>
                <p>${esc(pet.Status || 'Looking for a loving home!')}</p>
                <a href="adoption-form.html?pet=${encodeURIComponent(pet.Rescue_ID)}" class="btn-adopt">Adopt Me</a>
            </div>`;
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
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length === 0) return;
    slides[currentSlide].style.display = 'none';
    if (dots.length) dots[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    slides[currentSlide].style.display = 'flex';
    if (dots.length) dots[currentSlide].classList.add('active');
    resetCarouselTimer();
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    if (slides.length === 0 || index === currentSlide) return;
    slides[currentSlide].style.display = 'none';
    if (dots.length) dots[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].style.display = 'flex';
    if (dots.length) dots[currentSlide].classList.add('active');
    resetCarouselTimer();
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (carouselData.length > 1) carouselInterval = setInterval(() => changeSlide(1), 5000);
}

function resetCarouselTimer() {
    startCarousel();
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('carouselSlides')) loadCarouselPets();
    if (document.getElementById('specialNeedsCarousel')) loadSpecialNeedsCarousel();
    if (document.getElementById('newlyAdmittedCarousel')) loadNewlyAdmittedCarousel();
});

/* ============================================================
   CARD CAROUSELS (special needs / newly admitted)
   ============================================================ */

let specialNeedsIndex = 0;
let newlyAdmittedIndex = 0;
let specialNeedsPets = [];
let newlyAdmittedPets = [];

async function loadSpecialNeedsCarousel() {
    const container = document.getElementById('specialNeedsCarousel');
    const dotsContainer = document.getElementById('specialNeedsDots');
    if (!container) return;
    const result = await getAllAnimals();
    if (!result.success || !Array.isArray(result.data)) {
        container.innerHTML = `<p style="color:#aaa;padding:40px;">Error loading pets.</p>`;
        return;
    }
    specialNeedsPets = result.data.filter(pet => pet.Status === 'Special Needs');
    if (specialNeedsPets.length === 0) {
        container.innerHTML = `<p style="color:#aaa;padding:40px;">No special needs pets available.</p>`;
        return;
    }
    renderPetCarousel(container, dotsContainer, specialNeedsPets, 'specialNeeds');
    specialNeedsIndex = 0;
    updatePetCarousel(container, dotsContainer, specialNeedsPets, specialNeedsIndex, 'specialNeeds');
}

async function loadNewlyAdmittedCarousel() {
    const container = document.getElementById('newlyAdmittedCarousel');
    const dotsContainer = document.getElementById('newlyAdmittedDots');
    if (!container) return;
    const result = await getAllAnimals();
    if (!result.success || !Array.isArray(result.data)) {
        container.innerHTML = `<p style="color:#aaa;padding:40px;">Error loading pets.</p>`;
        return;
    }
    newlyAdmittedPets = result.data.filter(pet => pet.Status === 'Newly Admitted');
    if (newlyAdmittedPets.length === 0) {
        container.innerHTML = `<p style="color:#aaa;padding:40px;">No newly admitted pets available.</p>`;
        return;
    }
    renderPetCarousel(container, dotsContainer, newlyAdmittedPets, 'newlyAdmitted');
    newlyAdmittedIndex = 0;
    updatePetCarousel(container, dotsContainer, newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
}

function renderPetCarousel(container, dotsContainer, pets, type) {
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    let cardsPerView = 3;
    if (window.innerWidth < 768) cardsPerView = 1;
    else if (window.innerWidth < 1024) cardsPerView = 2;

    const totalSlides = Math.ceil(pets.length / cardsPerView);
    for (let i = 0; i < totalSlides; i++) {
        const slide = document.createElement('div');
        slide.className = 'pet-carousel-slide';
        slide.style.cssText = 'min-width:100%;display:flex;gap:20px;justify-content:center;padding:0 10px;flex-wrap:wrap;';
        const start = i * cardsPerView;
        const end = Math.min(start + cardsPerView, pets.length);
        for (let j = start; j < end; j++) slide.appendChild(createPetCard(pets[j]));
        container.appendChild(slide);

        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'pet-carousel-dot' + (i === 0 ? ' active' : '');
            dot.style.cssText = 'width:12px;height:12px;border-radius:50%;cursor:pointer;display:inline-block;margin:0 5px;transition:all 0.3s ease;background:' + (i === 0 ? '#FFD946' : 'rgba(255,255,255,0.3)');
            dot.onclick = () => goToPetSlide(i, type);
            dotsContainer.appendChild(dot);
        }
    }
}

function createPetCard(pet) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    card.style.cssText = 'background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,217,70,0.08);transition:transform 0.3s ease,box-shadow 0.3s ease;flex:1;min-width:250px;max-width:350px;';
    const statusColor = pet.Status === 'Special Needs' ? '#dc3545' : '#17a2b8';
    card.innerHTML = `
        <img src="${esc(petImage(pet))}" alt="${esc(pet.Name)}" style="width:100%;height:220px;object-fit:cover;background:#2d2d2d;"
             onerror="this.onerror=null;this.src=PLACEHOLDER_IMG">
        <div style="padding:18px 20px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                <h3 style="color:#FFD946;font-size:22px;font-weight:700;margin:0;">${esc(pet.Name || 'Unnamed')}</h3>
                <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;background:${statusColor};color:#fff;">${esc(pet.Status || 'Available')}</span>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 10px;">
                <span style="background:rgba(255,255,255,0.06);padding:3px 14px;border-radius:12px;font-size:13px;color:#ccc;">🐕 ${esc(pet.Species || 'Pet')}</span>
                <span style="background:rgba(255,255,255,0.06);padding:3px 14px;border-radius:12px;font-size:13px;color:#ccc;">${esc(pet.Breed || 'Mixed')}</span>
            </div>
            <div style="display:flex;gap:10px;">
                <a href="adoption-form.html?pet=${encodeURIComponent(pet.Rescue_ID)}" style="flex:1;text-align:center;background:#FFD946;color:#000;padding:10px 20px;border-radius:25px;text-decoration:none;font-weight:700;font-size:14px;">Adopt Me</a>
                <button onclick='openDynamicModal(${esc(JSON.stringify(pet))})' style="background:transparent;color:#FFD946;border:1px solid #FFD946;padding:10px 18px;border-radius:25px;font-weight:600;font-size:14px;cursor:pointer;">Details</button>
            </div>
        </div>`;
    return card;
}

function updatePetCarousel(container, dotsContainer, pets, index, type) {
    const slides = container.querySelectorAll('.pet-carousel-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.pet-carousel-dot') : [];
    if (slides.length === 0) return;
    slides.forEach((slide, i) => { slide.style.display = i === index ? 'flex' : 'none'; });
    dots.forEach((dot, i) => {
        dot.style.background = i === index ? '#FFD946' : 'rgba(255,255,255,0.3)';
        dot.style.transform = i === index ? 'scale(1.2)' : 'scale(1)';
    });
}

function scrollSpecialNeeds(direction) {
    const container = document.getElementById('specialNeedsCarousel');
    const slides = container.querySelectorAll('.pet-carousel-slide');
    if (slides.length === 0) return;
    specialNeedsIndex = (specialNeedsIndex + direction + slides.length) % slides.length;
    updatePetCarousel(container, document.getElementById('specialNeedsDots'), specialNeedsPets, specialNeedsIndex, 'specialNeeds');
}

function scrollNewlyAdmitted(direction) {
    const container = document.getElementById('newlyAdmittedCarousel');
    const slides = container.querySelectorAll('.pet-carousel-slide');
    if (slides.length === 0) return;
    newlyAdmittedIndex = (newlyAdmittedIndex + direction + slides.length) % slides.length;
    updatePetCarousel(container, document.getElementById('newlyAdmittedDots'), newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
}

function goToPetSlide(index, type) {
    if (type === 'specialNeeds') {
        specialNeedsIndex = index;
        updatePetCarousel(document.getElementById('specialNeedsCarousel'), document.getElementById('specialNeedsDots'), specialNeedsPets, specialNeedsIndex, 'specialNeeds');
    } else {
        newlyAdmittedIndex = index;
        updatePetCarousel(document.getElementById('newlyAdmittedCarousel'), document.getElementById('newlyAdmittedDots'), newlyAdmittedPets, newlyAdmittedIndex, 'newlyAdmitted');
    }
}

/* ---------- expose globally for inline handlers ---------- */
Object.assign(window, {
    loginUser, registerUser, logoutUser,
    getAllAnimals, getAnimalsGrouped, getAnimalById, getRainbowAnimals,
    addAnimal, updateAnimal, updateAnimalStatus, deleteAnimal,
    submitDonation, getPendingDonations, getAllDonations, verifyDonation, unverifyDonation, deleteDonation,
    submitAdoption, getAdoptions, getPendingAdoptions, trackAdoption, updateAdoptionStatus, deleteAdoption,
    getMedicalHistory, getAllMedicalRecords, getClinics, getRescueDropdown, addMedicalLog, deleteMedicalRecord,
    getDashboard,
    showNotification, validateForm, apiErrorText,
    placeholderImage, PLACEHOLDER_IMG,
    loadCategoryGallery, handlePetClick, openDynamicModal,
    loadCarouselPets, changeSlide, goToSlide,
    loadSpecialNeedsCarousel, loadNewlyAdmittedCarousel,
    scrollSpecialNeeds, scrollNewlyAdmitted, goToPetSlide,
});

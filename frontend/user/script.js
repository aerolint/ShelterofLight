const API_BASE = 'http://localhost/shelter_of_light/ShelterDashboard/backend/';

console.log('gumagana sya, gumagana sya!!');

let currentPets = []; 

async function loadCategoryGallery(categoryName) {
    const container = document.getElementById('pet-gallery');
    const result = await getAllAnimals(); 

    if (result.success) {
        currentPets = result.data.filter(p => p.Status === categoryName);
        
        container.innerHTML = currentPets.map((pet, index) => `
            <div class="img-box" onclick="handlePetClick(${index})">
                <img src="${pet.Photo_Path}" alt="${pet.Name}" loading="lazy">
                <p>${pet.Name}</p>
            </div>
        `).join('');
    }
}

function handlePetClick(index) {
    const pet = currentPets[index];
    openDynamicModal(pet);
}

function openDynamicModal(pet) {
    document.getElementById('modalName').innerText = pet.Name;
    document.getElementById('modalSpecies').innerText = pet.Species;
    document.getElementById('modalId').innerText = pet.Rescue_ID;
    document.getElementById('modalBreed').innerText = pet.Breed || 'N/A';
    document.getElementById('modalSex').innerText = pet.Sex || 'N/A';
    document.getElementById('modalFixed').innerText = pet.Spayed_Neutered == 1 ? 'Yes' : 'No';
    document.getElementById('modalLocation').innerText = pet.Found_Location || 'N/A';
    document.getElementById('modalAge').innerText = pet.Found_Age || 'N/A';
    document.getElementById('modalHealth').innerText = pet.Current_Health_Status || 'N/A';
    document.getElementById('modalClinic').innerText = pet.Veterinary_Clinic || 'N/A';
    document.getElementById('modalImg').innerHTML = `<img src="${pet.Photo_Path}" alt="${pet.Name}" style="width:100%;">`;
    
    document.getElementById('petModal').style.display = 'block';
}

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
    return await apiCall('manage_rescues.php?action=list', 'GET');
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

function openDynamicModal(pet) {
    document.getElementById('modalName').innerText = pet.Name;
    document.getElementById('modalSpecies').innerText = pet.Species;
    document.getElementById('modalId').innerText = pet.Rescue_ID;
    document.getElementById('modalBreed').innerText = pet.Breed || 'N/A';
    document.getElementById('modalSex').innerText = pet.Sex || 'N/A';
    document.getElementById('modalFixed').innerText = pet.Spayed_Neutered == 1 ? 'Yes' : 'No';
    document.getElementById('modalLocation').innerText = pet.Found_Location || 'N/A';
    document.getElementById('modalAge').innerText = pet.Found_Age || 'N/A';
    document.getElementById('modalHealth').innerText = pet.Current_Health_Status || 'N/A';
    document.getElementById('modalClinic').innerText = pet.Veterinary_Clinic || 'N/A';
    document.getElementById('modalImg').innerHTML = `<img src="${pet.Photo_Path}" alt="${pet.Name}" style="width:100%;">`;
    
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


window.openDynamicModal = openDynamicModal;
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

window.getAllAnimals = getAllAnimals;
window.loadCategoryGallery = loadCategoryGallery;
window.openDynamicModal = openDynamicModal;
// Enhanced index.js with user configuration
import { generateTextAndImage } from "./utils.js"

// Global user configuration
let userConfig = {
    name: "Anonymous Poet",
    favoriteActivity: "contemplating",
    favoritePlace: "a quiet garden",
    temperature: 0.8,
    avatarUrl: "avatar.png"
}

// DOM Elements
const configModal = document.getElementById("config-modal")
const mainContent = document.getElementById("main-content")
const userConfigForm = document.getElementById("user-config-form")
const useDefaultsBtn = document.getElementById("use-defaults")
const regenerateBtn = document.getElementById("regenerate-btn")
const editProfileBtn = document.getElementById("edit-profile-btn")
const creativitySlider = document.getElementById("creativity-level")
const creativityValue = document.getElementById("creativity-value")
const avatarUpload = document.getElementById("avatar-upload")
const avatarPreview = document.getElementById("avatar-preview")
const displayAvatar = document.getElementById("display-avatar")

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showConfigModal()
    setupEventListeners()
})

function setupEventListeners() {
    // Form submission
    userConfigForm.addEventListener('submit', handleFormSubmit)
    
    // Use defaults button
    useDefaultsBtn.addEventListener('click', useDefaultConfiguration)
    
    // Regenerate quote button
    regenerateBtn.addEventListener('click', regenerateQuote)
    
    // Edit profile button
    editProfileBtn.addEventListener('click', showConfigModal)
    
    // Creativity slider
    creativitySlider.addEventListener('input', updateCreativityDisplay)
    
    // Avatar upload
    avatarUpload.addEventListener('change', handleAvatarUpload)
}

function updateCreativityDisplay() {
    creativityValue.textContent = creativitySlider.value
}

function handleAvatarUpload(event) {
    const file = event.target.files[0]
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.')
            return
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB.')
            return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
            const imageUrl = e.target.result
            avatarPreview.src = imageUrl
            userConfig.avatarUrl = imageUrl
        }
        reader.readAsDataURL(file)
    }
}

function handleFormSubmit(event) {
    event.preventDefault()
    
    // Get form values
    userConfig.name = document.getElementById("user-name").value.trim()
    userConfig.favoriteActivity = document.getElementById("favorite-activity").value.trim()
    userConfig.favoritePlace = document.getElementById("favorite-place").value.trim()
    userConfig.temperature = parseFloat(creativitySlider.value)
    
    // Validate required fields
    if (!userConfig.name || !userConfig.favoriteActivity || !userConfig.favoritePlace) {
        alert('Please fill in all required fields.')
        return
    }
    
    // Clean up inputs
    userConfig.name = cleanInput(userConfig.name)
    userConfig.favoriteActivity = cleanInput(userConfig.favoriteActivity)
    userConfig.favoritePlace = cleanInput(userConfig.favoritePlace)
    
    hideConfigModal()
    generateQuote()
}

function useDefaultConfiguration() {
    // Fill form with defaults
    document.getElementById("user-name").value = "Anonymous Poet"
    document.getElementById("favorite-activity").value = "contemplating life"
    document.getElementById("favorite-place").value = "a peaceful garden"
    creativitySlider.value = "0.8"
    updateCreativityDisplay()
    
    // Reset avatar to default
    avatarPreview.src = "avatar.png"
    userConfig.avatarUrl = "avatar.png"
    avatarUpload.value = ""
    
    // Auto-submit with defaults
    setTimeout(() => {
        handleFormSubmit({ preventDefault: () => {} })
    }, 100)
}

function cleanInput(input) {
    // Basic input cleaning
    return input
        .replace(/[<>]/g, '') // Remove potential HTML
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/\s+/g, ' ') // Normalize spaces
}

function showConfigModal() {
    configModal.style.display = "flex"
    mainContent.style.display = "none"
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById("user-name").focus()
    }, 100)
}

function hideConfigModal() {
    configModal.style.display = "none"
    mainContent.style.display = "flex"
    
    // Update display avatar
    displayAvatar.src = userConfig.avatarUrl
}

async function generateQuote() {
    try {
        await generateTextAndImage(
            userConfig.name,
            userConfig.favoriteActivity,
            userConfig.favoritePlace,
            userConfig.temperature
        )
    } catch (error) {
        console.error('Error generating quote:', error)
        alert('Oops! Something went wrong generating your quote. Please try again.')
    }
}

function regenerateQuote() {
    generateQuote()
}

// Export for use in utils.js if needed
window.userConfig = userConfig

// Add some personality to the page
function addRandomQuoteOfTheDay() {
    const quotes = [
        "All the world's a stage, and all the men and women merely players...",
        "To be, or not to be, that is the question...",
        "The course of true love never did run smooth...",
        "We know what we are, but know not what we may be...",
        "Better a witty fool than a foolish wit..."
    ]
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    console.log(`🎭 Today's Shakespearean inspiration: "${randomQuote}"`)
}

// Call it when the page loads
addRandomQuoteOfTheDay()

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Press 'R' to regenerate (when not typing)
    if (event.key === 'r' && !event.target.matches('input, textarea') && mainContent.style.display !== 'none') {
        regenerateQuote()
    }
    
    // Press 'E' to edit profile (when not typing)
    if (event.key === 'e' && !event.target.matches('input, textarea') && mainContent.style.display !== 'none') {
        showConfigModal()
    }
    
    // Press 'Enter' in modal to submit
    if (event.key === 'Enter' && configModal.style.display === 'flex' && event.target.matches('input')) {
        handleFormSubmit(event)
    }
})
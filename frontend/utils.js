// Enhanced utils.js with personalized Shakespeare prompts

const quoteSpan = document.querySelector(".quote-span")
const quoteWrapper = document.querySelector(".quote-wrapper")
const nameSpan = document.querySelector(".name-span")
const loader = document.getElementById("loader")

// Configuration
const API_BASE_URL = "http://localhost:8000"
const UNSPLASH_API = "https://apis.scrimba.com/unsplash/photos/random"

function startLoading() {
  nameSpan.style.display = "none"
  quoteWrapper.style.display = "none"
  loader.style.display = "block"
  document.body.backgroundImage = ""
  
  // Add some loading variety
  const loadingMessages = [
    "Crafting thy Shakespearean verse...",
    "Invoking the spirit of the Bard...",
    "Weaving words of wonder...",
    "Consulting the celestial muses...",
    "Forging phrases most fair..."
  ]
  
  const loaderText = loader.querySelector('h3')
  if (loaderText) {
    loaderText.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  }
}

function stopLoading(name, url, quote) {
  nameSpan.style.display = "inline"
  quoteWrapper.style.display = "block"
  loader.style.display = "none"
  nameSpan.textContent = `${name} - ${getDate()}`
  
  if (url) {
    document.body.style.backgroundImage = `url(${url})`
  }
  
  quoteSpan.textContent = quote
  
  // Add a subtle animation
  quoteWrapper.style.animation = 'fadeIn 0.8s ease-in'
}

export async function generateTextAndImage(name, favActivity, favPlace, temperature) {
  startLoading()
  
  try {
    // Generate both image and poem concurrently
    const [url, quote] = await Promise.all([
      getImage(favPlace),
      getPersonalizedShakespearePoem(name, favActivity, favPlace, temperature)
    ])
    
    stopLoading(name, url, quote)
  } catch (error) {
    console.error("Error generating content:", error)
    stopLoading(
      name, 
      "", 
      "Alas! The digital quill hath failed to inscribe thy verse. Prithee, try again anon."
    )
  }
}

function getDate() {
  const date = new Date()
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  return `${monthNames[monthIndex]} ${year}`
}

async function getImage(query) {
  try {
    // Enhance the search query for better results
    const enhancedQuery = `${query} beautiful scenic image`
    const response = await fetch(`${UNSPLASH_API}?count=1&query=${encodeURIComponent(enhancedQuery)}`)
    
    if (response.ok) {
      const data = await response.json()
      return data[0]?.urls?.full || ""
    } else {
      console.error(`Unsplash API Error: ${response.status}`)
      return ""
    }
  } catch (error) {
    console.error("Error fetching image:", error)
    return ""
  }
}

async function getPersonalizedShakespearePoem(name, activity, place, temperature) {
  try {
    // Check if backend is running
    const healthResponse = await fetch(`${API_BASE_URL}/health`)
    if (!healthResponse.ok) {
      throw new Error("Poetry API is not available")
    }

    // Create a personalized prompt that includes the user's name
    const personalizedPrompt = createPersonalizedPrompt(name, activity, place)

    const response = await fetch(`${API_BASE_URL}/generate-poem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activity: activity,
        place: place,
        temperature: temperature,
        max_length: 100,
        custom_prompt: personalizedPrompt
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      return data.poem
    } else {
      console.error("Poetry generation failed:", data.error)
      return data.poem || getFallbackPoem(name, activity, place)
    }
  } catch (error) {
    console.error("Error calling Shakespeare API:", error)
    return getFallbackPoem(name, activity, place)
  }
}

function createPersonalizedPrompt(name, activity, place) {
  // Create various prompt styles for variety
  const promptStyles = [
    `When noble ${name} doth engage in ${activity} within ${place} fair,`,
    `In ${place} where ${name} finds joy in ${activity},`,
    `Behold! Fair ${name} at ${activity} in ${place} divine,`,
    `What light through yonder ${place} breaks? 'Tis ${name} at ${activity},`,
    `Sweet ${name}, whose ${activity} in ${place} doth shine,`
  ]
  
  return promptStyles[Math.floor(Math.random() * promptStyles.length)]
}

function getFallbackPoem(name, activity, place) {
  // Personalized fallback poems when API fails
  const fallbacks = [
    `When gentle ${name} doth find sweet peace in ${activity}, 
     In ${place}'s embrace where joy runs free,
     There dwells a soul content and true,
     Whose heart beats strong in all they do.`,
     
    `Fair ${name}, whose love for ${activity} burns bright,
     In ${place} finds solace day and night.
     What greater joy could mortals find
     Than peace of body, heart, and mind?`,
     
    `In ${place} fair, where ${name} doth roam,
     And ${activity} makes the heart feel home,
     There lies a truth both pure and deep:
     True happiness is ours to keep.`
  ]
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// Check API health on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (response.ok) {
      const health = await response.json()
      console.log("🎭 Poetry API Status:", health)
      
      if (health.model_loaded) {
        console.log("✅ Shakespeare model ready!")
      }
    }
  } catch (error) {
    console.warn("⚠️ Poetry API not available:", error.message)
    console.log("📝 Using fallback poems instead")
  }
})

// Add CSS animation for quote appearance
const style = document.createElement('style')
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`
document.head.appendChild(style)
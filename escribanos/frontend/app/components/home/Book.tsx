'use client'
import { useState } from 'react'

export default function Book() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const benefits = [
    {
      icon: "⏱️",
      title: "Optimizá tu trabajo",
      description: "Lo que antes te llevaba horas, ahora en segundos."
    },
    {
      icon: "🎯",
      title: "Precisión garantizada",
      description: "Todos los artículos del arancel actualizados"
    },
    {
      icon: "💰",
      title: "Accesible para todos",
      description: "5 cálculos mensuales sin costo. Con opción Pro."
    }
  ]

  const handleBookClick = () => {
    if (!isOpen) {
      setIsOpen(true)
      setCurrentPage(0)
    }
  }

  const nextPage = () => {
    if (currentPage < benefits.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <section className="book-section-layout">
      {/* Texto a la derecha */}
      <div className="book-text">
        <h2>Descubrí los beneficios</h2>
        <p>Hacé click en el libro para abrirlo</p>
      </div>

      {/* Libro a la izquierda */}
      <div className="book-wrapper">
        <div className={`book-interactive ${isOpen ? 'open' : ''}`}>
          
          <div 
            className="book-spine-visible"
            style={{ backgroundImage: 'url(/book-spine.jpg)' }}
          ></div>

          {/* Tapa que se abre */}
          <div 
            className="book-cover-page" 
            onClick={handleBookClick}
            style={{ backgroundImage: 'url(/book-cover.jpg)' }}
          >
            <div className="cover-overlay">
              <h3>Beneficios</h3>
              <p>Click para abrir</p>
            </div>
          </div>

          {/* Páginas internas */}
          <div className="book-inside">
            <div className="book-page-content">
              <span className="benefit-icon">{benefits[currentPage].icon}</span>
              <h3>{benefits[currentPage].title}</h3>
              <p>{benefits[currentPage].description}</p>
              
              <div className="page-nav">
                <button 
                  onClick={prevPage}
                  className="page-btn"
                >
                  {currentPage === 0 ? 'Cerrar' : 'Anterior'}
                </button>
                <span className="page-indicator">
                  {currentPage + 1} / {benefits.length}
                </span>
                {currentPage < benefits.length - 1 && (
                  <button 
                    onClick={nextPage}
                    className="page-btn"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    
  )
}
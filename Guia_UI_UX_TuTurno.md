# Guía de Identidad Visual y UI/UX - TuTurno

Este documento detalla los lineamientos de diseño y usabilidad para el proyecto **TuTurno**, un sistema digital de gestión de colas basado en la Teoría de Colas (M/M/c). El enfoque principal es la eficiencia operativa, la sostenibilidad ambiental y la inclusión social.

---

## 🎨 1. Identidad Visual (Paleta de Colores)

La paleta de colores ha sido seleccionada para transmitir calma, confianza y sostenibilidad.

### Colores Principales
* **Primario: Verde Esmeralda / Turquesa (`#10B981`)**
    * **Significado:** Representa el impacto ambiental positivo (ahorro de papel) y el progreso ("vía libre").
    * **Uso:** Barras de progreso, iconos de éxito y elementos relacionados con la sostenibilidad.
* **Secundario: Azul Institucional (`#1E3A8A`)**
    * **Significado:** Transmite seriedad, seguridad y profesionalismo.
    * **Uso:** Navegación, textos principales y encabezados.

### Colores de Soporte
* **Acento: Naranja Cálido (`#F59E0B`)**
    * **Uso:** Alertas de "Es tu turno", botones de acción principal (CTA) y notificaciones importantes.
* **Fondos y Neutros (`#F3F4F6`, `#FFFFFF`)**
    * **Uso:** Fondos de pantalla y tarjetas de información para mantener un diseño limpio y de alto contraste.

---

## 📱 2. Heurísticas de Usabilidad para Móvil

Basadas en los principios de Jakob Nielsen, adaptadas para la experiencia de espera de TuTurno.

### 1. Visibilidad del Estado del Sistema
El usuario debe conocer su posición en la cola en todo momento.
* **Implementación:** Mostrar el número de turno, posición actual y tiempo estimado de espera actualizado en tiempo real mediante WebSockets o sondeo constante.

### 2. Relación entre el Sistema y el Mundo Real
Utilizar lenguaje humano, no técnico.
* **Implementación:** Evitar términos como "λ=39.4". Usar: "Hay 5 personas antes que tú. Tiempo estimado: 10 minutos".

### 3. Control y Libertad del Usuario
Facilitar la salida del sistema.
* **Implementación:** Botón claro de "Abandonar cola" o "Cancelar turno" con una confirmación breve para evitar errores.

### 4. Consistencia y Estándares
Seguir los patrones nativos (Material Design / iOS).
* **Implementación:** Botones táctiles de al menos 44x44dp y navegación intuitiva.

### 5. Prevención de Errores
Evitar que el usuario pierda su lugar accidentalmente.
* **Implementación:** Guardar el estado del turno localmente (Persistence) por si la aplicación se cierra o se pierde la conexión.

### 6. Diseño Minimalista
Eliminar distracciones durante la espera.
* **Implementación:** Mostrar solo la información crítica en la pantalla principal: número de turno y tiempo restante.

---

## ♿ 3. Accesibilidad e Inclusión (Impacto Social)

Dado que Guatemala tiene una alta tasa de analfabetismo (~18.5%) y prevalencia de discapacidad visual, estos puntos son mandatorios:

1.  **Text-to-Speech (TTS):** Botón prominente para leer en voz alta el estado del turno y las instrucciones.
2.  **Contraste Elevado:** Asegurar un ratio de contraste de al menos 4.5:1 para textos.
3.  **Etiquetado ARIA:** Uso correcto de propiedades de accesibilidad para lectores de pantalla nativos (TalkBack/VoiceOver).
4.  **Iconografía Descriptiva:** Acompañar textos con iconos universales para usuarios con dificultades de lectura.

---

## 🛠️ 4. Notas Técnicas (React Native)

Para implementar esta guía en React Native, se recomiendan las siguientes librerías y prácticas:

* **Estado en tiempo real:** Uso de `Zustand` o `Context API` para manejar la información del turno globalmente.
* **Componentes:** `React Native Paper` para componentes que respeten los estándares de accesibilidad nativos.
* **Voz:** `react-native-tts` para la integración del motor de audio.
* **Accesibilidad:** Utilizar las props `accessible={true}`, `accessibilityLabel` y `accessibilityRole` en todos los elementos interactivos.

---
*Documento preparado para el equipo de desarrollo de TuTurno - Feria EMI 2026.*

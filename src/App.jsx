import { useState } from 'react'
import Scene from './components/three/Scene'
import ChatIntro from './components/ui/ChatIntro'
import Hotbar from './components/ui/HotBar'
import ChestGUI from './components/ui/ChestGUI'
import LoadingScreen from './components/ui/LoadingScreen'

export default function App() {
  const [skillsReveal, setSkillsReveal] = useState(0)

  return (
    <>
      {/* Minecraft-style 3s loading screen on first paint */}
      <LoadingScreen />
      {/* Fixed 3D canvas — stays full-screen while page scrolls */}
      <Scene onSkillsReveal={setSkillsReveal} />

      {/* Scroll driver — hero → about sign → walk to chest → skills */}
      <div id="scroll-container" style={{ height: '780vh' }} />

      {/* UI overlays — already fixed-positioned internally */}
      <ChatIntro />
      <Hotbar />

      {/* Skills chest inventory — fades in as the chest opens */}
      <ChestGUI reveal={skillsReveal} />
    </>
  )
}

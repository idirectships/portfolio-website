import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Experience from '@/components/Experience';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />

        <About />

        <div className="section-alt">
          <Projects />
        </div>

        <Skills />

        <div className="section-alt">
          <Experience />
        </div>

        <Contact />
      </main>
      <Footer />
    </>
  );
}

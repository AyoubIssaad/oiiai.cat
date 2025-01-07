import React from "react";
import { Link } from "react-router-dom";
import {
  Cat,
  Gamepad2,
  MessageSquare,
  Sparkles,
  Send,
  Keyboard,
  Users,
  Rocket,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../ui/Button";
import SEO from "../SEO";

export function CatalanAboutPage() {
  const trackEvent = (eventName, eventParams = {}) => {
    if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Oiiai Cat - Animació Interactiva de Gat Giratori",
          text: "Mira aquest gat giratori divertit i el joc!",
          url: "https://oiiai.cat",
        });
        trackEvent("content_shared", { method: "native_share" });
      } else {
        await navigator.clipboard.writeText("https://oiiai.cat");
        alert("Enllaç copiat al portapapers!");
        trackEvent("content_shared", { method: "clipboard_copy" });
      }
    } catch (error) {
      console.error("Error compartint:", error);
      trackEvent("share_error", { error: error.message });
    }
  };

  return (
    <>
      <SEO
        title="🐱 Oiiai i el Gat Plàtan fan voltes! - El parc oficial d'Oiiai Cat"
        description="Descobreix el llegendari Oiiai Cat (també conegut com el Gat Plàtan) en acció! Fes que el gat giri, envia missatges secrets de gat i difon l'alegria per Internet. L'experiència més purrfecta del meme del gat! 🌟"
        path="/ca"
      />

      {/* Back Button */}
      <div className="container mx-auto px-4 pt-6 mt-20">
        <Link to="/about">
          <Button className="kawaii-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to English
          </Button>
        </Link>
      </div>

      {/* Secció Principal */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 mt-8 mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-4 mb-6">
              <span className="kawaii-heading text-4xl">
                Benvinguts a Oiiai Cat
              </span>
            </h1>
            <p className="text-lg text-blue-700 mb-8">
              Experimenta el fenomen viral! Controla el famós gat giratori, juga
              a jocs divertits i descobreix més alegria cada dia.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="kawaii-card p-8 bg-gradient-to-br from-blue-50 to-white">
            <h2 className="kawaii-title text-2xl text-center mb-8 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Característiques Impressionants
              <Sparkles className="w-6 h-6 text-blue-500" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Cat className="w-8 h-8 text-blue-500 animate-[bounce_2s_ease-in-out_infinite]" />
                  <p className="text-blue-700 font-medium">
                    Fes que el Gat Plàtan giri sense parar!
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Envia missatges secrets en llenguatge de gat
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Keyboard className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Juga a jocs d'escriptura amb patrons Oiiai
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Send className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Comparteix l'alegria amb altres fans dels gats
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Uneix-te a la comunitat del gat giratori
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Rocket className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Descobreix noves maneres de jugar amb el Gat Plàtan
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button onClick={handleShare} className="kawaii-button accent">
                <Share2 className="w-4 h-4 mr-2" />
                Comparteix la Diversió!
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Targetes de Característiques */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Gat Interactiu */}
          <Link
            to="/cat"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Cat className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Gat Interactiu</h2>
            <p className="text-blue-700 mb-4">
              Fes que el Gat Plàtan giri! Controla l'animació icònica amb
              sincronització musical perfecta.
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Prova-ho ara →
            </span>
          </Link>

          {/* Missatges Secrets */}
          <Link
            to="/secret"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Missatges Secrets</h2>
            <p className="text-blue-700 mb-4">
              Envia missatges misteriosos codificats en gat utilitzant l'antic
              llenguatge Oiiai!
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Envia ara →
            </span>
          </Link>

          {/* Jocs */}
          <Link
            to="/games"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Jocs Divertits</h2>
            <p className="text-blue-700 mb-4">
              Posa a prova les teves habilitats amb la nostra col·lecció de jocs
              i reptes del Gat Plàtan!
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Juga ara →
            </span>
          </Link>
        </div>
      </section>

      {/* Secció Sobre el Gat */}
      <section className="container mx-auto px-4 mb-16">
        <div className="kawaii-card p-8 max-w-4xl mx-auto">
          <h2 className="kawaii-title text-2xl text-center mb-8">
            Sobre el Gat Plàtan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">🐱</span>
                <div>
                  <h3 className="kawaii-subtitle text-xl mb-2">
                    Què és un Gat Oiiai?
                  </h3>
                  <p className="text-blue-700">
                    La història de la sensació giratòria que va conquerir
                    Internet! També conegut com el Gat Plàtan, aquest adorable
                    felí ha estat girant el seu camí cap als cors de tot el món
                    amb les seves rotacions hipnòtiques i melodies enganxoses.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">🔮</span>
                <div>
                  <h3 className="kawaii-subtitle text-xl mb-2">
                    Llenguatge Secret de Gat
                  </h3>
                  <p className="text-blue-700">
                    Envia missatges secrets en l'antiga llengua del gat
                    giratori! El nostre traductor especial Oiiai converteix les
                    teves paraules en patrons misteriosos de gat. Perfecte per a
                    comunicacions secretes amb altres entusiastes del Gat
                    Plàtan!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-blue-700 mt-6">
            <h3 className="kawaii-subtitle text-xl mb-4">Dades Curioses:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                El meme original va aconseguir milions de visualitzacions a les
                xarxes socials
              </li>
              <li>
                La nostra versió interactiva afegeix noves formes de gaudir del
                gat estimat
              </li>
              <li>
                La funció de missatges secrets utilitza sons reals de gat per a
                l'autenticitat
              </li>
              <li>Perfecte per a descansos curts i pujar l'ànim al moment</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Secció d'Estadístiques */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Usuaris Feliços</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">10K+</p>
            <p className="text-blue-700">Difonent alegria diàriament</p>
          </div>
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Girs Generats</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">1M+</p>
            <p className="text-blue-700">I segueix augmentant!</p>
          </div>
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Partides Jugades</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">500K+</p>
            <p className="text-blue-700">Moments divertits creats</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default CatalanAboutPage;

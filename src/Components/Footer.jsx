const Footer = () => {
  return (
    <footer className="text-gray-300 mt-10 lg:px-4 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold text-white">SYNCPEDIA</h2>
          <p className="text-sm mt-2">
            Website terpercaya untuk pembelian mata uang & leveling game.
          </p>
        </div>

        {/* Fitur */}
        <div>
          <h3 className="text-white font-semibold mb-3">Fitur</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Game</a></li>
            <li><a href="#" className="hover:text-white">Leveling</a></li>
            <li><a href="#" className="hover:text-white">Transaksi Terbaru</a></li>
          </ul>
        </div>

        {/* Bantuan */}
        <div>
          <h3 className="text-white font-semibold mb-3">Legalitas</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
            <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
          </ul>
        </div>

        {/* Sosial Media */}
        <div>
          <h3 className="text-white font-semibold mb-3">Bantuan</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white">Whatsapp</a></li>
            <li><a href="#" className="hover:text-white">Instagram</a></li>
          </ul>
          </div>
        </div>

      {/* Copyright */}
      <div className="border-t border-zinc-800 text-sm text-center py-4 text-gray-400">
        © {new Date().getFullYear()} SYNCPEDIA. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
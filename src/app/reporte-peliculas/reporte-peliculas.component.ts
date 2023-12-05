import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  filtroGenero: string = '';
  filtroAnio: number | undefined;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.aplicarFiltros();
    });
  }

  aplicarFiltros() {
    console.log('Before Filters:', this.peliculas);

    this.peliculasFiltradas = this.peliculas
      .filter(pelicula => {
        const generoMatch = !this.filtroGenero || pelicula.genero.toLowerCase().includes(this.filtroGenero.toLowerCase());
        const anioMatch = this.filtroAnio === undefined || pelicula.lanzamiento === this.filtroAnio;
        if (this.filtroGenero === '' && this.filtroAnio === undefined) {
          return true;
        }

        return generoMatch && anioMatch;
      });

    console.log('After Filters:', this.peliculasFiltradas);
  }





  generarPDF() {
    this.aplicarFiltros();
    const pdfTitle =  'Informe_Peliculas';

    const contenido = [
      { text: `Informe de Películas`, style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'tableHeader' },
              { text: 'Género', style: 'tableHeader' },
              { text: 'Año de lanzamiento', style: 'tableHeader' }
            ],
            ...this.peliculasFiltradas.map(pelicula => [
              { text: pelicula.titulo, style: 'tableRow' },
              { text: pelicula.genero, style: 'tableRow' },
              { text: pelicula.lanzamiento.toString(), style: 'tableRow' }
            ])
          ]
        }
      }
    ];

    const estilos: any = {
      header: {
        fontSize: 18,
        bold: true,
        color: '#3498db',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      table: {
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: '#3498db',
        alignment: 'center'
      },
      tableRow: {
        fontSize: 10,
        color: '#34495e',
        alignment: 'center'
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };
    pdfMake.createPdf(documentDefinition).download(`${pdfTitle}.pdf`);
  }


  generarExcel() {
    this.aplicarFiltros();

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.peliculasFiltradas);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Peliculas');
    XLSX.writeFile(wb, 'informe_peliculas.xlsx');
  }

  exportarCSV() {
    this.aplicarFiltros();

    const csv = Papa.unparse(this.peliculasFiltradas, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'informe_peliculas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

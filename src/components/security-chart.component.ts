import { Component, input, effect, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import { Lead } from '../services/gemini.service';

@Component({
  selector: 'app-security-chart',
  standalone: true,
  template: '<div #chartContainer class="p-4 bg-white rounded-xl shadow-md border border-gray-100"></div>',
  styles: [`:host { display: block; }`]
})
export class SecurityChartComponent {
  leads = input<Lead[]>([]);
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  constructor() {
    effect(() => {
      const leads = this.leads();
      if (leads && leads.length > 0) {
        this.renderChart(leads);
      }
    });
  }

  renderChart(leads: Lead[]) {
    const secured = leads.filter(l => l.securityStatus !== 'Unsecured').length;
    const insecure = leads.length - secured;
    const data = [{ name: 'Secured/Modern', value: secured }, { name: 'Insecure/Legacy', value: insecure }];

    const container = d3.select(this.chartContainer.nativeElement);
    container.selectAll('*').remove();

    const width = 300;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };

    const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('fill', '#10b981')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.name)!)
      .attr('y', d => y(d.value))
      .attr('height', d => y(0) - y(d.value))
      .attr('width', x.bandwidth());

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5));
      
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Security Posture Distribution');
  }
}

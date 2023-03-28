import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from 'mapbox-gl';
import { v4 } from 'uuid';
import { Subject } from "rxjs";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN;

export const useMapbox = ( puntoInicial ) => {
  // Referencia al DIV del mapa
  const mapaDiv = useRef();
  const setRef = useCallback( ( node ) => {
    mapaDiv.current = node;
  }, [] );

  // Referencia los marcadores
  const marcadores = useRef( {} );

  // Observables de Rxjs
  const movimientoMarcador = useRef( new Subject() );
  const nuevoMarcador = useRef( new Subject() );

  // Mapa y coords
  const mapa = useRef();
  const [ coords, setCoords ] = useState( puntoInicial );

  // Función para agregar marcadores
  const agregarMarcador = useCallback( ( ev, id ) => {
    // Si ev.lngLat es undefined, deestructura de ev
    const { lng, lat } = ev.lngLat || ev;

    const marker = new mapboxgl.Marker();
    marker.id = id ?? v4();

    marker
      .setLngLat( [ lng, lat ] )
      .addTo( mapa.current )
      .setDraggable( true );

    marcadores.current[ marker.id ] = marker;

    if ( !id ) {
      nuevoMarcador.current.next({
        id: marker.id,
        lng,
        lat
      });
    }

    // Escuchar movimientos del marcador
    marker.on( 'drag', ( { target } ) => {
      const { id } = target;
      const { lng, lat } = target.getLngLat();
      
      // TODO: Emitir los cambios del marcador

      movimientoMarcador.current.next({
        id: id,
        lng,
        lat
      });
    } )
  }, [] );

  // Función para actualizar la ubicación del marcador
  const actualizarPosicion = useCallback( ( { id, lng, lat } ) => {
    marcadores.current[id].setLngLat( [ lng, lat ] );
  }, [] );

  useEffect( () => {
    const map = new mapboxgl.Map({
      container: mapaDiv.current, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [ puntoInicial.lng, puntoInicial.lat ], // starting position [lng, lat]
      zoom: puntoInicial.zoom, // starting zoom
    });

    mapa.current = map;
  }, [ puntoInicial ] )

  // Cuando se mueve el mapa
  useEffect( () => {
    mapa.current?.on( 'move', () => {
      const { lng, lat } = mapa.current.getCenter();
      setCoords({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: mapa.current.getZoom().toFixed(2)
      });
    } );

    return () => {
      mapa.current?.off( 'move' );
    }
  }, [] );

  // Agregar marcadores cuando hago click
  useEffect( () => {
    mapa.current?.on( 'click', agregarMarcador );

    return () => {
      mapa.current?.off( 'click' );
    }
  }, [ agregarMarcador ] );

  return {
    actualizarPosicion,
    agregarMarcador,
    coords,
    marcadores,
    movimientoMarcador$: movimientoMarcador.current,
    nuevoMarcador$: nuevoMarcador.current,
    setRef
  }
}

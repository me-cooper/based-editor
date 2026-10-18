import * as THREE from 'three';
import {ThreeMFLoader} from 'three/addons/loaders/3MFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function disposeObject(object){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  object?.traverse(node=>{if(node.geometry)geometries.add(node.geometry);for(const material of [].concat(node.material||[])){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
  for(const texture of textures)texture.dispose();for(const material of materials)material.dispose();for(const geometry of geometries)geometry.dispose();
}
export default {
  id:'three-mf',title:'3MF Viewer',files:['3mf'],design:{file:'three-mf.css'},
  actions:[{id:'attach',label:'3D-Datei anhängen',command:'import-media',kind:'file'}],
  render(file,{escape}){return `<section class="viewer"><header><strong>${escape(file.name)}</strong><div class="buttons"><button class="home" type="button">Ansicht zurücksetzen</button><button class="wire" type="button" aria-pressed="false">Drahtgitter</button><label><input class="spin" type="checkbox"> Drehen</label></div></header><div class="viewport" aria-label="Interaktive 3D-Vorschau"></div><p class="status" role="status">Lade 3MF …</p></section>`;},
  async mount(root,{file,signal,onDispose,emit}){
    const viewport=root.querySelector('.viewport'),status=root.querySelector('.status');
    let renderer,controls,model,observer,disposed=false;
    const dispose=()=>{if(disposed)return;disposed=true;observer?.disconnect();renderer?.setAnimationLoop(null);controls?.dispose();disposeObject(model);renderer?.dispose();renderer?.forceContextLoss();};onDispose(dispose);
    try{
      const bytes=await file.arrayBuffer();if(signal.aborted)return;
      model=new ThreeMFLoader().parse(bytes);if(signal.aborted){disposeObject(model);model=null;return;}
      model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model);if(bounds.isEmpty())throw Error('Die 3MF-Datei enthält keine sichtbare Geometrie.');
      const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());model.position.sub(center);
      const extent=Math.max(size.x,size.y,size.z);if(!Number.isFinite(extent)||extent<=0)throw Error('Ungültige Modellabmessungen.');
      const scene=new THREE.Scene();scene.background=new THREE.Color('#19221c');scene.add(model);
      scene.add(new THREE.HemisphereLight(0xffffff,0x445544,2.5));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(2,4,3);scene.add(light);
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
      viewport.append(renderer.domElement);
      const camera=new THREE.PerspectiveCamera(40,1,Math.max(extent/10000,.00001),extent*1000);
      controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.autoRotateSpeed=1.2;
      let fitted=false;
      function fit(){const vertical=THREE.MathUtils.degToRad(camera.fov),horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect),distance=extent/(2*Math.tan(Math.min(vertical,horizontal)/2))*1.65;camera.position.set(distance*.75,distance*.5,distance);controls.target.set(0,0,0);controls.update();}
      function resize(){if(disposed)return;const width=Math.max(viewport.clientWidth,1),height=Math.max(viewport.clientHeight,1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(!fitted){fit();fitted=true;}}
      observer=new ResizeObserver(resize);observer.observe(viewport);resize();
      root.querySelector('.home').addEventListener('click',fit,{signal});
      root.querySelector('.spin').addEventListener('change',e=>{controls.autoRotate=e.target.checked;},{signal});
      root.querySelector('.wire').addEventListener('click',e=>{const enabled=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(enabled));model.traverse(node=>{for(const material of [].concat(node.material||[]))if('wireframe' in material)material.wireframe=enabled;});emit('model:wireframe',{enabled});},{signal});
      let meshes=0,vertices=0;model.traverse(node=>{if(node.isMesh){meshes++;vertices+=node.geometry.attributes.position?.count||0;}});
      status.textContent=`${meshes} Mesh(es) · ${vertices} Vertices · Ziehen: drehen · Scrollen: zoomen`;
      renderer.setAnimationLoop(()=>{if(!disposed){controls.update();renderer.render(scene,camera);}});
      emit('model:ready',{name:file.name,meshes,vertices,format:'3mf'});
    }catch(error){if(signal.aborted)return;dispose();status.textContent='3MF-Vorschau fehlgeschlagen: '+error.message;status.classList.add('error');throw error;}
  }
};
